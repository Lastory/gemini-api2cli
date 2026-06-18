/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import type { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { mkdtemp, rm, mkdir, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from '@google/gemini-cli-core';
import * as path from 'node:path';
import * as acp from '@agentclientprotocol/sdk';
import type {
  SessionNotification,
  ContentBlock,
} from '@agentclientprotocol/sdk';
import { logger } from '../utils/logger.js';

// Re-export types for consumers
export type { ContentBlock, SessionNotification };

type AcpWorkerState = 'starting' | 'ready' | 'error' | 'dead';

export interface AcpSessionInfo {
  acpSessionId: string;
  credentialId: string;
  createdAt: number;
  lastActivity: number;
}

export interface AcpWorkerInfo {
  credentialId: string;
  state: AcpWorkerState;
  sessionCount: number;
  lastActivity: number;
  /** Number of prompt records retained in the in-memory ring buffer. */
  recentPromptCount: number;
}

/** Status of a recorded prompt turn. */
export type AcpPromptStatus =
  | 'in_progress'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * One prompt turn recorded for the admin console. Holds truncated
 * summaries of the user prompt and assistant reply plus token usage —
 * enough to be useful in the UI without unbounded memory growth.
 *
 * Ephemeral by design: the server keeps only the last N records per
 * worker (see {@link MAX_RECENT_PROMPTS_PER_WORKER}); the worker exits
 * along with its history when the credential is removed or the worker
 * idle-times-out.
 */
export interface AcpPromptRecord {
  /** Worker-local sequence id ("p1", "p2", ...). */
  id: string;
  acpSessionId: string;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  status: AcpPromptStatus;
  /** First {@link PROMPT_SUMMARY_CAP} chars of the user content. */
  promptSummary: string;
  /** Total user-content character count (across all text blocks). */
  promptCharCount: number;
  /** First {@link PROMPT_SUMMARY_CAP} chars of the streamed agent reply. */
  responseSummary: string;
  /** Total assistant-content character count streamed back. */
  responseCharCount: number;
  errorMessage?: string;
  /** Prompt-turn token usage as reported by the agent (when available). */
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  thoughtTokens?: number;
}

interface PromptListener {
  onUpdate: (update: SessionNotification) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export interface AcpPoolDeps {
  cliEntryPath: string;
  spawnProcess: typeof spawn;
}

export interface AcpPoolSettings {
  idleTimeoutMs: number;
  mcpEnabled: boolean;
  extensionsEnabled: boolean;
  skillsEnabled: boolean;
  proxyUrl: string;
  maxWorkers: number;
  failoverWorkers: number;
  /**
   * Keepalive interval in ms. When a worker has been idle for this
   * long, the pool fires a no-cost re-authenticate against the
   * underlying CLI subprocess to refresh OAuth tokens and exercise
   * the gRPC channel before they expire. 0 disables keepalive (the
   * first user request after idle then pays the warm-up cost).
   * Recommended: 540_000 (9 min) — comfortably under the typical
   * 10-15 min HTTP/2 idle close used by Google's load balancers and
   * the 1-hour OAuth access token TTL.
   */
  keepaliveIntervalMs?: number;
}

const GEMINI_DIR_NAME = '.gemini';
// 0 means "never time out" — workers stay alive until explicit shutdown.
// The admin console exposes this as seconds; see promptApiConsole.ts.
const DEFAULT_IDLE_TIMEOUT_MS = 0;

// Per-worker ring buffer size for recent prompts shown in the admin
// console. 20 strikes a balance between "useful diagnostic depth" and
// "bounded memory" — at the {@link PROMPT_SUMMARY_CAP} cap below, 20
// records is at most ~80 KB per worker.
const MAX_RECENT_PROMPTS_PER_WORKER = 20;
// Per-side character cap for prompt/response summaries. The admin UI
// only needs enough to identify the turn at a glance; full content
// stays in caller-supplied logs.
const PROMPT_SUMMARY_CAP = 2000;

/**
 * Best-effort textual summary of a prompt input. Walks the content
 * blocks in order and concatenates text content until the cap is hit;
 * non-text blocks are rendered as a placeholder so the user can still
 * tell what was sent. Never throws — used only for diagnostics.
 */
function summarizePromptContent(blocks: ContentBlock[]): {
  summary: string;
  charCount: number;
} {
  let summary = '';
  let charCount = 0;
  for (const block of blocks) {
    if (block.type === 'text' && typeof block.text === 'string') {
      charCount += block.text.length;
      if (summary.length < PROMPT_SUMMARY_CAP) {
        const remaining = PROMPT_SUMMARY_CAP - summary.length;
        summary += block.text.slice(0, remaining);
      }
    } else if (block.type === 'image') {
      if (summary.length < PROMPT_SUMMARY_CAP) summary += '[image]';
    } else if (block.type === 'audio') {
      if (summary.length < PROMPT_SUMMARY_CAP) summary += '[audio]';
    } else if (block.type === 'resource' || block.type === 'resource_link') {
      if (summary.length < PROMPT_SUMMARY_CAP) summary += '[resource]';
    }
  }
  return { summary, charCount };
}

function buildAcpChildEnv(
  isolatedHomeDir: string,
  settings: AcpPoolSettings,
): NodeJS.ProcessEnv {
  const env = { ...process.env };

  env['GEMINI_CLI_HOME'] = isolatedHomeDir;
  env['GOOGLE_GENAI_USE_GCA'] = 'true';
  env['HOME'] = isolatedHomeDir;
  env['USERPROFILE'] = isolatedHomeDir;

  if (!settings.mcpEnabled) {
    env['GEMINI_MCP_DISABLED'] = 'true';
  }
  if (!settings.extensionsEnabled) {
    env['GEMINI_EXTENSIONS_DISABLED'] = 'true';
  }
  if (!settings.skillsEnabled) {
    env['GEMINI_SKILLS_DISABLED'] = 'true';
  }
  if (settings.proxyUrl) {
    env['HTTP_PROXY'] = settings.proxyUrl;
    env['HTTPS_PROXY'] = settings.proxyUrl;
    env['http_proxy'] = settings.proxyUrl;
    env['https_proxy'] = settings.proxyUrl;
  }

  return env;
}

/**
 * Extract a readable error message from any error type.
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * A single long-lived CLI process running in ACP mode.
 * Can switch credentials at runtime via re-authentication.
 */
export class AcpWorker {
  credentialId: string;
  private child: ChildProcessWithoutNullStreams | undefined;
  private connection: acp.ClientSideConnection | undefined;
  private _state: AcpWorkerState = 'starting';
  private sessions = new Map<string, AcpSessionInfo>();
  private promptListeners = new Map<string, PromptListener>();
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private idleTimeoutMs: number;
  private _lastActivity = Date.now();
  private tempDir: string | undefined;
  private workspaceCwd: string | undefined;
  private defaultSessionId: string | undefined;
  private onDead: (() => void) | undefined;
  // FIFO ring buffer of the most recent prompt turns this worker has
  // handled. Bounded by MAX_RECENT_PROMPTS_PER_WORKER. Powers the
  // admin console's expandable per-worker detail panel.
  private recentPrompts: AcpPromptRecord[] = [];
  private nextPromptSeq = 1;
  // Recent stderr from the CLI subprocess. Bounded so a chatty CLI
  // can't grow this unbounded. The test endpoint reads this after
  // a failed prompt to surface the real Google error (429, RESOURCE
  // _EXHAUSTED, etc.) — the CLI tends to swallow API errors and
  // resolve prompt() with an empty reply, so stderr is usually the
  // only signal that something went wrong.
  private stderrTail = '';
  private static readonly MAX_STDERR_TAIL = 16 * 1024; // 16 KB
  // Background timer firing keepalive auth refreshes. See
  // {@link AcpPoolSettings.keepaliveIntervalMs} for rationale.
  private keepaliveTimer: ReturnType<typeof setInterval> | undefined;
  private keepaliveIntervalMs = 0;

  constructor(
    credentialId: string,
    idleTimeoutMs: number,
    onDead?: () => void,
  ) {
    this.credentialId = credentialId;
    // Use `??` so an explicit 0 ("never timeout") passes through unchanged.
    // `||` would coerce 0 to the default, silently overriding the operator's
    // choice to keep workers alive indefinitely.
    this.idleTimeoutMs = idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    this.onDead = onDead;
  }

  get state(): AcpWorkerState {
    return this._state;
  }
  get lastActivity(): number {
    return this._lastActivity;
  }
  get sessionCount(): number {
    return this.sessions.size;
  }

  getInfo(): AcpWorkerInfo {
    return {
      credentialId: this.credentialId,
      state: this._state,
      sessionCount: this.sessions.size,
      lastActivity: this._lastActivity,
      recentPromptCount: this.recentPrompts.length,
    };
  }

  getSessions(): AcpSessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Snapshot of the bounded stderr tail. Used by the credential-test
   * post-mortem to recover the real upstream error when the CLI has
   * swallowed it.
   */
  getStderrTail(): string {
    return this.stderrTail;
  }

  /**
   * Snapshot the recent-prompts ring buffer (newest last). Returns a
   * shallow copy — callers can iterate freely without holding back
   * eviction.
   */
  getRecentPrompts(): AcpPromptRecord[] {
    // Defensive copy of each record; prompt records are mutated in
    // place while a turn streams, and we don't want callers reading
    // half-updated objects across awaits.
    return this.recentPrompts.map((r) => ({ ...r }));
  }

  /**
   * Append a record to the ring buffer, dropping the oldest entry if
   * the buffer is full. Mutating the returned reference later (to
   * append response chunks, set status, etc.) is intentional and safe
   * because {@link getRecentPrompts} returns shallow copies.
   */
  private appendPromptRecord(record: AcpPromptRecord): void {
    this.recentPrompts.push(record);
    while (this.recentPrompts.length > MAX_RECENT_PROMPTS_PER_WORKER) {
      this.recentPrompts.shift();
    }
  }

  /**
   * Start the CLI process in ACP mode, initialize and authenticate.
   */
  async start(
    deps: AcpPoolDeps,
    settings: AcpPoolSettings,
    credentialHomeDir: string,
  ): Promise<void> {
    // Create isolated temp directory for this worker
    this.tempDir = await mkdtemp(path.join(tmpdir(), 'gemini-acp-'));
    const homeDir = path.join(this.tempDir, 'home');
    const cwd = path.join(this.tempDir, 'workspace');
    const geminiDir = path.join(homeDir, GEMINI_DIR_NAME);
    await mkdir(geminiDir, { recursive: true });
    await mkdir(cwd, { recursive: true });
    this.workspaceCwd = cwd;

    // Copy credential files from source
    const credFiles = ['oauth_creds.json', 'gemini-credentials.json'];
    const sourceGeminiDir = path.join(credentialHomeDir, GEMINI_DIR_NAME);
    for (const file of credFiles) {
      const src = path.join(sourceGeminiDir, file);
      if (existsSync(src)) {
        await copyFile(src, path.join(geminiDir, file));
      }
    }

    const args = ['--no-warnings=DEP0040', deps.cliEntryPath, '--acp'];

    const env = buildAcpChildEnv(homeDir, settings);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    this.child = deps.spawnProcess(process.execPath, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as unknown as ChildProcessWithoutNullStreams;

    // Log stderr in real-time AND keep a bounded tail buffer that
    // the credential-test post-mortem can scrape for "429" /
    // "RESOURCE_EXHAUSTED" markers when the CLI swallows the real
    // error and resolves prompt() with an empty reply.
    let stderrBuf = '';
    this.child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrBuf += text;
      // Append to per-worker tail and truncate to the cap. We trim
      // at line boundaries when possible so log scraping doesn't
      // hit a half-line at the start.
      this.stderrTail += text;
      if (this.stderrTail.length > AcpWorker.MAX_STDERR_TAIL) {
        const overflow = this.stderrTail.length - AcpWorker.MAX_STDERR_TAIL;
        const sliceFrom = this.stderrTail.indexOf('\n', overflow);
        this.stderrTail = this.stderrTail.slice(
          sliceFrom > 0 ? sliceFrom + 1 : overflow,
        );
      }
      logger.error(`[ACP][stderr] ${text.trim()}`);
    });

    // Detect crash
    this.child.on('exit', (code) => {
      if (this._state !== 'dead') {
        logger.error(
          `[ACP] Worker for credential ${this.credentialId} exited with code ${String(code)}`,
        );
        if (stderrBuf.trim()) {
          logger.error(`[ACP] stderr: ${stderrBuf.trim()}`);
        }
        this._state = 'dead';
        // Reject any pending prompts
        for (const [, listener] of this.promptListeners) {
          listener.onError(
            new Error(`ACP process exited unexpectedly (code ${String(code)})`),
          );
        }
        this.promptListeners.clear();
        this.onDead?.();
      }
    });

    // Create ACP connection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const stdout = Readable.toWeb(
      this.child.stdout,
    ) as ReadableStream<Uint8Array>;
    const stdin = Writable.toWeb(
      this.child.stdin,
    ) as WritableStream<Uint8Array>;
    const stream = acp.ndJsonStream(stdin, stdout);

    this.connection = new acp.ClientSideConnection(
      () => ({
        sessionUpdate: async (params: SessionNotification) => {
          const listener = this.promptListeners.get(params.sessionId);
          if (listener) {
            listener.onUpdate(params);
          }
        },
        // Auto-approve all tool calls in API gateway mode
        requestPermission: async () => ({
          outcome: {
            outcome: 'selected' as const,
            optionId: 'allow_once',
          },
        }),
      }),
      stream,
    );

    try {
      await this.connection.initialize({
        clientVersion: '1.0.0',
        protocolVersion: acp.PROTOCOL_VERSION,
        capabilities: {},
      });

      await this.connection.authenticate({
        methodId: 'oauth-personal',
      });

      this._state = 'ready';
      this.resetIdleTimer();
      // Start the background keepalive *after* the worker reaches
      // ready state so we never ping a half-initialized CLI.
      this.keepaliveIntervalMs = Math.max(0, settings.keepaliveIntervalMs ?? 0);
      this.startKeepalive();
      logger.info(`[ACP] Worker started for credential ${this.credentialId}`);
    } catch (err) {
      this._state = 'error';
      logger.error(
        `[ACP] Worker init failed for credential ${this.credentialId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      await this.shutdown();
      throw err;
    }
  }

  /**
   * Create a new session in this worker.
   */
  async createSession(cwd?: string): Promise<string> {
    if (this._state !== 'ready' || !this.connection) {
      throw new Error('ACP worker not ready');
    }

    const sessionCwd = cwd || this.workspaceCwd || '/tmp';
    logger.info(`[ACP] Creating session with cwd: ${sessionCwd}`);
    let sessionId: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const resp = await this.connection.newSession({
        cwd: sessionCwd,
        mcpServers: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sessionId = resp.sessionId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      logger.error(`[ACP] newSession error: ${msg}`);
      throw err instanceof Error ? err : new Error(msg);
    }

    this.sessions.set(sessionId, {
      acpSessionId: sessionId,
      credentialId: this.credentialId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    this.touchActivity();
    logger.info(
      `[ACP] Session ${sessionId} created on credential ${this.credentialId}`,
    );
    return sessionId;
  }

  /**
   * Get the default session, creating it on first call.
   * Subsequent calls reuse the same session (no re-initialization).
   */
  async getOrCreateDefaultSession(): Promise<string> {
    if (this.defaultSessionId && this.sessions.has(this.defaultSessionId)) {
      this.touchActivity();
      return this.defaultSessionId;
    }
    const sessionId = await this.createSession();
    this.defaultSessionId = sessionId;
    return sessionId;
  }

  /**
   * Send a prompt and stream back session updates.
   * Returns a promise that resolves when the prompt turn is complete.
   */
  async prompt(
    sessionId: string,
    contentBlocks: ContentBlock[],
    onUpdate: (update: SessionNotification) => void,
  ): Promise<acp.PromptResponse> {
    if (this._state !== 'ready' || !this.connection) {
      throw new Error('ACP worker not ready');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Cancel any pending prompt on the same session
    if (this.promptListeners.has(sessionId)) {
      try {
        await this.connection.cancel({ sessionId });
      } catch {
        // ignore cancel errors
      }
    }

    this.touchActivity();
    session.lastActivity = Date.now();

    // Open a fresh record in the recent-prompts ring buffer. The
    // record is mutated as chunks stream in and finalized in the
    // resolve/reject branches below. Tracking lives entirely inside
    // this method so the public API surface is unchanged.
    const { summary: promptSummary, charCount: promptCharCount } =
      summarizePromptContent(contentBlocks);
    const promptRecord: AcpPromptRecord = {
      id: `p${this.nextPromptSeq++}`,
      acpSessionId: sessionId,
      startedAt: Date.now(),
      status: 'in_progress',
      promptSummary,
      promptCharCount,
      responseSummary: '',
      responseCharCount: 0,
    };
    this.appendPromptRecord(promptRecord);

    // Wrap the caller's onUpdate so we can intercept chunks/usage for
    // the ring buffer without changing observable behavior. Errors in
    // this wrapper must NEVER propagate — accounting bugs should not
    // break the live stream the request handler depends on.
    const trackedOnUpdate = (update: SessionNotification): void => {
      try {
        const u = update.update;
        if (
          u.sessionUpdate === 'agent_message_chunk' &&
          u.content.type === 'text' &&
          typeof u.content.text === 'string'
        ) {
          const chunk = u.content.text;
          promptRecord.responseCharCount += chunk.length;
          if (promptRecord.responseSummary.length < PROMPT_SUMMARY_CAP) {
            const remaining =
              PROMPT_SUMMARY_CAP - promptRecord.responseSummary.length;
            promptRecord.responseSummary += chunk.slice(0, remaining);
          }
        }
      } catch {
        // Diagnostics must not break the prompt stream.
      }
      onUpdate(update);
    };

    const finalize = (
      status: AcpPromptStatus,
      opts?: {
        usage?: acp.PromptResponse['usage'];
        errorMessage?: string;
      },
    ): void => {
      // `cancelled` is sticky — once the operator (or test
      // endpoint) cancels a prompt, the record reflects what the
      // user actually saw at the time, not the eventual outcome
      // of the still-in-flight CLI request. The actual final
      // outcome (success/error/quota) is captured by the caller's
      // post-mortem handler if it cares — see the test endpoint
      // in promptApi.ts.
      if (promptRecord.status === 'cancelled') return;
      promptRecord.status = status;
      promptRecord.finishedAt = Date.now();
      promptRecord.durationMs =
        promptRecord.finishedAt - promptRecord.startedAt;
      if (opts?.errorMessage !== undefined) {
        promptRecord.errorMessage = opts.errorMessage;
      }
      const usage = opts?.usage ?? null;
      if (usage) {
        promptRecord.inputTokens = usage.inputTokens;
        promptRecord.outputTokens = usage.outputTokens;
        promptRecord.totalTokens = usage.totalTokens;
        if (usage.cachedReadTokens != null) {
          promptRecord.cachedTokens = usage.cachedReadTokens;
        }
        if (usage.thoughtTokens != null) {
          promptRecord.thoughtTokens = usage.thoughtTokens;
        }
      }
    };

    return new Promise<acp.PromptResponse>((resolve, reject) => {
      this.promptListeners.set(sessionId, {
        onUpdate: trackedOnUpdate,
        onDone: () => {
          // Will be resolved by the prompt() return
        },
        onError: (err: Error) => {
          this.promptListeners.delete(sessionId);
          finalize('error', { errorMessage: err.message });
          reject(err);
        },
      });

      this.connection!.prompt({
        sessionId,
        prompt: contentBlocks,
      })
        .then((response: acp.PromptResponse) => {
          this.promptListeners.delete(sessionId);
          this.touchActivity();
          // ACP signals user-initiated cancellation via stopReason
          // rather than rejection; surface it as a distinct status so
          // the admin UI can show it differently from outright errors.
          const status: AcpPromptStatus =
            response.stopReason === 'cancelled' ? 'cancelled' : 'completed';
          // Pull usage into a local first so ts-eslint's stricter
          // unsafe-assignment rule sees a typed binding instead of
          // a property access on the (loosely typed) PromptResponse.
          const usage: acp.PromptResponse['usage'] = response.usage;
          finalize(status, { usage });
          resolve(response);
        })
        .catch((err: unknown) => {
          this.promptListeners.delete(sessionId);
          let msg: string;
          if (err instanceof Error) {
            finalize('error', { errorMessage: err.message });
            reject(err);
            return;
          }
          if (typeof err === 'string') {
            msg = err;
          } else {
            try {
              msg = JSON.stringify(err);
            } catch {
              msg = String(err);
            }
          }
          finalize('error', { errorMessage: msg });
          reject(new Error(msg));
        });
    });
  }

  /**
   * Set the model for a session.
   */
  async setSessionModel(sessionId: string, modelId: string): Promise<void> {
    if (this._state !== 'ready' || !this.connection) {
      throw new Error('ACP worker not ready');
    }
    await this.connection.unstable_setSessionModel({ sessionId, modelId });
    this.touchActivity();
  }

  /**
   * Switch this worker to a different credential by copying new credential
   * files into the isolated home and re-authenticating.
   */
  async switchCredential(
    newCredentialId: string,
    newCredentialHomeDir: string,
  ): Promise<void> {
    if (this._state !== 'ready' || !this.connection || !this.tempDir) {
      throw new Error('ACP worker not ready for credential switch');
    }

    // Clear old credential files, then copy new ones
    const geminiDir = path.join(this.tempDir, 'home', GEMINI_DIR_NAME);
    const sourceGeminiDir = path.join(newCredentialHomeDir, GEMINI_DIR_NAME);
    const credFiles = ['oauth_creds.json', 'gemini-credentials.json'];
    for (const file of credFiles) {
      const target = path.join(geminiDir, file);
      try {
        await unlink(target);
      } catch {
        /* file may not exist */
      }
      const src = path.join(sourceGeminiDir, file);
      if (existsSync(src)) {
        await copyFile(src, target);
      }
    }

    // Re-authenticate with the new credentials
    await this.connection.authenticate({
      methodId: 'oauth-personal',
    });

    this.credentialId = newCredentialId;
    this.touchActivity();
    logger.info(`[ACP] Worker switched credential to ${newCredentialId}`);
  }

  /**
   * Cancel an ongoing prompt.
   *
   * Marks the most recent in-flight prompt record for this session
   * as 'cancelled' immediately rather than waiting for the agent's
   * acknowledgment. The actual ACP cancel request still races
   * upstream, but the admin console's prompt-row status updates
   * within one poll instead of stalling on "in_progress" until the
   * CLI acks (which can take 30+ seconds when Google itself is slow
   * to respond, e.g. on quota-exhausted credentials).
   */
  async cancelPrompt(sessionId: string): Promise<void> {
    // Find the most recent record for this session that's still
    // in_progress and flip it. There's only ever one such record
    // because prompt() rejects on overlap, but iterate from newest
    // to be safe — the ring buffer is small (≤20).
    for (let i = this.recentPrompts.length - 1; i >= 0; i--) {
      const r = this.recentPrompts[i];
      if (r.acpSessionId === sessionId && r.status === 'in_progress') {
        r.status = 'cancelled';
        r.finishedAt = Date.now();
        r.durationMs = r.finishedAt - r.startedAt;
        if (!r.errorMessage) r.errorMessage = 'Cancelled by client';
        break;
      }
    }
    if (this.connection && this._state === 'ready') {
      await this.connection.cancel({ sessionId });
    }
  }

  /**
   * Destroy a specific session.
   * Sends a request to the remote ACP worker to clean up the session,
   * then removes local references.
   */
  destroySession(sessionId: string): void {
    // First, notify the remote worker to close the session
    if (this.connection && this._state === 'ready') {
      try {
        this.connection
          .unstable_closeSession({ sessionId })
          .catch((err: unknown) => {
            logger.debug(
              `[ACP] Failed to close session ${sessionId} on remote: ${extractErrorMessage(err)}`,
            );
          });
      } catch (err) {
        logger.debug(
          `[ACP] Failed to close session ${sessionId} on remote: ${extractErrorMessage(err)}`,
        );
      }
    }

    // Then clean up local references
    this.sessions.delete(sessionId);
    this.promptListeners.delete(sessionId);
    if (this.sessions.size === 0) {
      this.resetIdleTimer();
    }
  }

  /**
   * Shut down this worker, kill the process.
   */
  async shutdown(): Promise<void> {
    this._state = 'dead';
    this.clearIdleTimer();
    this.stopKeepalive();

    // Reject pending prompts
    for (const [, listener] of this.promptListeners) {
      listener.onError(new Error('ACP worker shutting down'));
    }
    this.promptListeners.clear();
    this.sessions.clear();

    if (this.child) {
      this.child.kill();
      this.child = undefined;
    }
    this.connection = undefined;

    if (this.tempDir) {
      try {
        await rm(this.tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
      this.tempDir = undefined;
    }

    logger.info(`[ACP] Worker shut down for credential ${this.credentialId}`);
  }

  private touchActivity(): void {
    this._lastActivity = Date.now();
    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    if (this.idleTimeoutMs > 0 && this._state === 'ready') {
      this.idleTimer = setTimeout(() => {
        logger.info(
          `[ACP] Worker idle timeout for credential ${this.credentialId}, shutting down`,
        );
        void this.shutdown().then(() => this.onDead?.());
      }, this.idleTimeoutMs);
    }
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  /**
   * Begin periodic keepalive pings. The CLI subprocess re-runs the
   * stored OAuth flow on each call, which is enough to: (a) refresh
   * an expired access_token via the refresh_token, and (b) keep the
   * gRPC channel to Google warm so the next user-facing request
   * doesn't pay a fresh TLS+HTTP/2 handshake. No-op if the interval
   * is 0 ("disabled") or the worker is not ready.
   */
  private startKeepalive(): void {
    this.stopKeepalive();
    if (this.keepaliveIntervalMs <= 0) return;
    if (this._state !== 'ready') return;
    this.keepaliveTimer = setInterval(() => {
      void this.runKeepalive();
    }, this.keepaliveIntervalMs);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = undefined;
    }
  }

  /**
   * Skip the ping if the worker has had real traffic recently —
   * touching the connection is pointless if a user request just
   * exercised it. {@link AcpPoolSettings.keepaliveIntervalMs} is
   * also our staleness threshold here.
   */
  private async runKeepalive(): Promise<void> {
    if (this._state !== 'ready' || !this.connection) return;
    const idleFor = Date.now() - this._lastActivity;
    if (idleFor < this.keepaliveIntervalMs) return;
    // Don't pile a keepalive on top of an in-flight prompt — the
    // CLI doesn't multiplex, and we'd block both calls.
    if (this.promptListeners.size > 0) return;
    try {
      await this.connection.authenticate({ methodId: 'oauth-personal' });
      // Don't call touchActivity() here — keepalives shouldn't push
      // back the idle timeout. The whole point is to refresh the
      // connection without making the worker look "active" to the
      // pool's eviction logic.
      logger.debug(
        `[ACP] Keepalive refreshed credential ${this.credentialId} (idle ${Math.floor(idleFor / 1000)}s)`,
      );
    } catch (err) {
      // Log but don't kill the worker — a single failed keepalive
      // doesn't mean the worker is dead, and the next user request
      // will surface a real error if the connection is truly gone.
      logger.warn(
        `[ACP] Keepalive failed for ${this.credentialId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

/**
 * Pool of ACP workers, one per credential.
 */
export class AcpProcessPool {
  private workers = new Map<string, AcpWorker>();
  private deps: AcpPoolDeps;

  constructor(deps: AcpPoolDeps) {
    this.deps = deps;
  }

  /**
   * Get or create a worker for the given credential.
   * When maxWorkers > 0 and the pool is full, evicts the least recently active worker.
   */
  async getOrCreate(
    credentialId: string,
    credentialHomeDir: string,
    settings: AcpPoolSettings,
  ): Promise<AcpWorker> {
    let worker = this.workers.get(credentialId);
    if (worker && worker.state === 'ready') {
      return worker;
    }

    // Clean up dead worker if exists
    if (worker && worker.state !== 'ready') {
      this.workers.delete(credentialId);
    }

    // At capacity: try to switch an existing idle worker's credential instead of cold-starting
    const max =
      settings.maxWorkers > 0
        ? settings.maxWorkers + (settings.failoverWorkers || 0)
        : 0;
    if (max > 0 && this.workers.size >= max) {
      // Find the least recently active idle worker to reuse
      let reuseKey: string | undefined;
      let reuseTime = Infinity;
      for (const [key, w] of this.workers) {
        if (
          w.state === 'ready' &&
          w.sessionCount === 0 &&
          w.lastActivity < reuseTime
        ) {
          reuseTime = w.lastActivity;
          reuseKey = key;
        }
      }
      // Only switch workers with no active sessions to avoid breaking in-flight requests

      if (reuseKey) {
        const reuseWorker = this.workers.get(reuseKey)!;
        try {
          logger.info(
            `[ACP] Pool at capacity (${max}), switching worker ${reuseKey} → ${credentialId}`,
          );
          await reuseWorker.switchCredential(credentialId, credentialHomeDir);
          // Re-key in the map
          this.workers.delete(reuseKey);
          this.workers.set(credentialId, reuseWorker);
          return reuseWorker;
        } catch (err) {
          logger.warn(
            `[ACP] Credential switch failed, falling back to evict+rebuild: ${err instanceof Error ? err.message : String(err)}`,
          );
          // Switch failed, evict and rebuild below
          this.workers.delete(reuseKey);
          void reuseWorker.shutdown();
        }
      } else {
        // No idle worker to switch — evict the least recently active one as last resort
        let oldestKey: string | undefined;
        let oldestTime = Infinity;
        for (const [key, w] of this.workers) {
          if (w.lastActivity < oldestTime) {
            oldestTime = w.lastActivity;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          logger.info(
            `[ACP] Pool at capacity (${max}), evicting worker ${oldestKey}`,
          );
          const evicted = this.workers.get(oldestKey);
          this.workers.delete(oldestKey);
          if (evicted) void evicted.shutdown();
        }
      }
    }

    worker = new AcpWorker(credentialId, settings.idleTimeoutMs, () => {
      // Use worker.credentialId (not the captured closure value)
      // because switchCredential may have changed it
      this.workers.delete(worker!.credentialId);
    });

    this.workers.set(credentialId, worker);

    try {
      await worker.start(this.deps, settings, credentialHomeDir);
    } catch (err) {
      this.workers.delete(credentialId);
      throw err;
    }

    return worker;
  }

  /**
   * Destroy a specific worker by credential ID.
   */
  async destroy(credentialId: string): Promise<void> {
    const worker = this.workers.get(credentialId);
    if (worker) {
      this.workers.delete(credentialId);
      await worker.shutdown();
    }
  }

  /**
   * Destroy all workers.
   */
  async destroyAll(): Promise<void> {
    const shutdowns = Array.from(this.workers.values()).map((w) =>
      w.shutdown(),
    );
    this.workers.clear();
    await Promise.all(shutdowns);
    logger.info('[ACP] All workers destroyed');
  }

  /**
   * Get status of all workers.
   */
  getStatus(): { workers: AcpWorkerInfo[] } {
    return {
      workers: Array.from(this.workers.values()).map((w) => w.getInfo()),
    };
  }

  /**
   * Get all sessions across all workers.
   */
  getAllSessions(): AcpSessionInfo[] {
    const sessions: AcpSessionInfo[] = [];
    for (const worker of this.workers.values()) {
      sessions.push(...worker.getSessions());
    }
    return sessions;
  }

  /**
   * Get the recent-prompts ring buffer for a specific worker. Returns
   * an empty array if the worker doesn't exist (callers don't need to
   * distinguish "no worker" from "no recent prompts" — both render
   * identically in the UI).
   */
  getRecentPrompts(credentialId: string): AcpPromptRecord[] {
    const worker = this.workers.get(credentialId);
    return worker ? worker.getRecentPrompts() : [];
  }

  /**
   * Find the worker that owns a session.
   */
  findWorkerBySession(sessionId: string): AcpWorker | undefined {
    for (const worker of this.workers.values()) {
      if (worker.getSessions().some((s) => s.acpSessionId === sessionId)) {
        return worker;
      }
    }
    return undefined;
  }

  /**
   * Speculative lookup: returns the worker for the given credential only if
   * it is already in 'ready' state. Never evicts, never spawns — callers use
   * this for opportunistic operations (e.g. credential prefetch) where a
   * cache miss must NOT impact other in-flight requests.
   */
  getReadyWorker(credentialId: string): AcpWorker | undefined {
    const worker = this.workers.get(credentialId);
    return worker && worker.state === 'ready' ? worker : undefined;
  }

  /**
   * Pre-warm a worker for the given credential so the first request avoids cold start.
   */
  async warmUp(
    credentialId: string,
    credentialHomeDir: string,
    settings: AcpPoolSettings,
  ): Promise<void> {
    try {
      await this.getOrCreate(credentialId, credentialHomeDir, settings);
      logger.info(`[ACP] Worker pre-warmed for credential ${credentialId}`);
    } catch (err) {
      logger.warn(
        `[ACP] Worker warm-up failed for credential ${credentialId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  get size(): number {
    return this.workers.size;
  }
}
