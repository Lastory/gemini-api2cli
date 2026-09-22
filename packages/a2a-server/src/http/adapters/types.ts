/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

export interface NormalizedGenerationConfig {
  maxOutputTokens?: number;
  thinkingConfig?: {
    thinkingLevel?: string;
    includeThoughts?: boolean;
  };
  temperature?: number;
  topP?: number;
  topK?: number;
}

export type NormalizedPromptRequest = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  generationConfig?: NormalizedGenerationConfig;
};

export type StreamJsonEvent = {
  type: string;
  role?: string;
  content?: string;
  [key: string]: unknown;
};

export type UsageInfo = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedReadTokens?: number | null;
  thoughtTokens?: number | null;
  rawUsageMetadata?: Record<string, unknown>;
};

/* ── Format Adapter interface ── */

export interface FormatAdapter {
  /** Parse the raw request body into a NormalizedPromptRequest. */
  parseRequest(body: unknown): NormalizedPromptRequest;

  /** Whether this request wants streaming. */
  wantsStream(body: unknown): boolean;

  /** Content-Type header for streaming responses. */
  readonly streamContentType: string;

  /** Build the full JSON response for non-streaming mode. */
  buildJsonResponse(
    assistantText: string,
    model: string,
    requestId: string,
    usage?: UsageInfo,
  ): unknown;

  /** Build the full JSON error response. */
  buildJsonError(
    message: string,
    status: number,
    model: string,
    requestId: string,
  ): unknown;

  /** Format a single streaming chunk (assistant content delta). */
  formatStreamChunk(
    content: string,
    model: string,
    requestId: string,
    isFirst: boolean,
  ): string;

  /** Format the final streaming message (finish signal). */
  formatStreamEnd(model: string, requestId: string, usage?: UsageInfo): string;

  /** Format a streaming error event. */
  formatStreamError(message: string, model: string, requestId: string): string;
}

/* ── Gemini API types ── */

export type GeminiPart = { text: string };

export type GeminiContent = {
  role?: string;
  parts: GeminiPart[];
};

export type GeminiRequestBody = {
  contents?: unknown;
  systemInstruction?: unknown;
  generationConfig?: unknown;
  model?: unknown;
};

export type GeminiCandidate = {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason?: string;
};

export type GeminiResponse = {
  candidates: GeminiCandidate[];
  modelVersion?: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
};

/* ── OpenAI API types ── */

export type OpenAIMessage = {
  role: string;
  content: string;
};

export type OpenAIRequestBody = {
  model?: unknown;
  messages?: unknown;
  stream?: unknown;
  max_tokens?: unknown;
  max_completion_tokens?: unknown;
  temperature?: unknown;
  top_p?: unknown;
  reasoning_effort?: unknown;
};

export type OpenAIChoice = {
  index: number;
  message: OpenAIMessage;
  finish_reason: string | null;
};

export type OpenAIStreamChoice = {
  index: number;
  delta: Partial<OpenAIMessage>;
  finish_reason: string | null;
};

export type OpenAIUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
};

export type OpenAIResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
};

export type OpenAIStreamResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
  usage?: OpenAIUsage;
};
