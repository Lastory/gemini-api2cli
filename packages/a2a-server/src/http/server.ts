#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as url from 'node:url';
import * as path from 'node:path';

import { logger } from '../utils/logger.js';
import { main } from './app.js';
import { shutdownAllAcpPools } from './acpProcessPool.js';

// Check if the module is the main script being run
const isMainModule =
  path.basename(process.argv[1]) ===
  path.basename(url.fileURLToPath(import.meta.url));

if (
  import.meta.url.startsWith('file:') &&
  isMainModule &&
  process.env['NODE_ENV'] !== 'test'
) {
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[CoreAgent] Received ${signal}, shutting down gracefully...`);
    try {
      await shutdownAllAcpPools();
    } catch (err) {
      logger.error('[CoreAgent] Error during shutdown:', err);
    }
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('uncaughtException', (error) => {
    logger.error('Unhandled exception:', error);
    void shutdownAllAcpPools().finally(() => process.exit(1));
  });

  main().catch((error) => {
    logger.error('[CoreAgent] Unhandled error in main:', error);
    void shutdownAllAcpPools().finally(() => process.exit(1));
  });
}
