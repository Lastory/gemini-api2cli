/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, utimes } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { tmpdir } from '@google/gemini-cli-core';
import {
  AcpWorker,
  AcpProcessPool,
  cleanStaleAcpTempDirs,
  shutdownAllAcpPools,
  buildAcpChildEnv,
} from './acpProcessPool.js';

describe('acpProcessPool cleanup & lifecycle', () => {
  describe('cleanStaleAcpTempDirs', () => {
    const createdDirs: string[] = [];

    afterEach(async () => {
      for (const dir of createdDirs) {
        try {
          await rm(dir, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
      createdDirs.length = 0;
    });

    it('cleans up stale gemini-acp directories and preserves recent and non-gemini dirs', async () => {
      const base = tmpdir();
      // 1. Create a stale gemini-acp directory (simulated 2 hours old)
      const staleDir = await mkdtemp(path.join(base, 'gemini-acp-stale-'));
      createdDirs.push(staleDir);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await utimes(staleDir, twoHoursAgo, twoHoursAgo);

      // 2. Create a fresh gemini-acp directory (just created)
      const freshDir = await mkdtemp(path.join(base, 'gemini-acp-fresh-'));
      createdDirs.push(freshDir);

      // 3. Create a non-matching directory
      const nonGeminiDir = await mkdtemp(path.join(base, 'other-tool-stale-'));
      createdDirs.push(nonGeminiDir);
      await utimes(nonGeminiDir, twoHoursAgo, twoHoursAgo);

      // Sweep with 1-hour threshold
      const cleaned = await cleanStaleAcpTempDirs(60 * 60 * 1000);

      expect(cleaned).toBeGreaterThanOrEqual(1);
      expect(existsSync(staleDir)).toBe(false);
      expect(existsSync(freshDir)).toBe(true);
      expect(existsSync(nonGeminiDir)).toBe(true);
    }, 15000);
  });

  describe('AcpWorker tempDir cleanup', () => {
    it('kills child process and deletes tempDir on shutdown even on Windows', async () => {
      const base = tmpdir();
      const tempDir = await mkdtemp(path.join(base, 'gemini-acp-worker-'));
      const child = spawn(
        process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'],
        { cwd: tempDir },
      );

      const worker = new AcpWorker('test-cred', 0);
      // Inject tempDir and running child
      (worker as unknown as { tempDir: string }).tempDir = tempDir;
      (worker as unknown as { child: typeof child }).child = child;

      expect(existsSync(tempDir)).toBe(true);

      await worker.shutdown();

      expect(existsSync(tempDir)).toBe(false);
      expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
    });

    it('cleans up tempDir when child process exits unexpectedly', async () => {
      const base = tmpdir();
      const tempDir = await mkdtemp(path.join(base, 'gemini-acp-crash-'));
      const child = spawn(
        process.execPath,
        ['-e', 'setTimeout(() => process.exit(0), 50)'],
        { cwd: tempDir },
      );

      const worker = new AcpWorker('test-cred-crash', 0);
      (worker as unknown as { tempDir: string }).tempDir = tempDir;
      (worker as unknown as { child: typeof child }).child = child;

      // Simulate the exit listener attached in AcpWorker.start
      child.on('exit', () => {
        void (
          worker as unknown as { cleanupTempDir: () => Promise<void> }
        ).cleanupTempDir();
      });

      // Wait for child to exit
      await new Promise<void>((resolve) =>
        child.once('close', () => resolve()),
      );
      // Allow async cleanup to finish
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(existsSync(tempDir)).toBe(false);
    });
  });

  describe('shutdownAllAcpPools', () => {
    it('destroys all active pools and removes them from the registry', async () => {
      const mockDeps = {
        cliEntryPath: 'fake-cli.js',
        spawnProcess: vi.fn(),
      };
      const pool = new AcpProcessPool(mockDeps);
      const destroyAllSpy = vi.spyOn(pool, 'destroyAll');

      await shutdownAllAcpPools();

      expect(destroyAllSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildAcpChildEnv', () => {
    const defaultSettings = {
      idleTimeoutMs: 0,
      mcpEnabled: false,
      extensionsEnabled: false,
      skillsEnabled: false,
      proxyUrl: '',
      maxWorkers: 1,
      failoverWorkers: 0,
    };

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('defaults GEMINI_CLI_TRUST_WORKSPACE to true when unset', () => {
      vi.stubEnv('GEMINI_CLI_TRUST_WORKSPACE', '');
      const env = buildAcpChildEnv('/fake/home', defaultSettings);
      expect(env['GEMINI_CLI_TRUST_WORKSPACE']).toBe('true');
    });

    it('respects explicitly configured GEMINI_CLI_TRUST_WORKSPACE=false', () => {
      vi.stubEnv('GEMINI_CLI_TRUST_WORKSPACE', 'false');
      const env = buildAcpChildEnv('/fake/home', defaultSettings);
      expect(env['GEMINI_CLI_TRUST_WORKSPACE']).toBe('false');
    });

    it('respects explicitly configured GEMINI_CLI_TRUST_WORKSPACE=true', () => {
      vi.stubEnv('GEMINI_CLI_TRUST_WORKSPACE', 'true');
      const env = buildAcpChildEnv('/fake/home', defaultSettings);
      expect(env['GEMINI_CLI_TRUST_WORKSPACE']).toBe('true');
    });
  });
});
