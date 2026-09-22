/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import type {
  FormatAdapter,
  NormalizedPromptRequest,
  NormalizedGenerationConfig,
  OpenAIRequestBody,
  OpenAIResponse,
  OpenAIStreamResponse,
  OpenAIUsage,
  UsageInfo,
} from './types.js';

class BadRequestError extends Error {}

function buildOpenAiUsage(usage?: UsageInfo): OpenAIUsage {
  const promptTokens = usage?.inputTokens ?? 0;
  const completionTokens = usage?.outputTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? promptTokens + completionTokens;
  const cachedTokens = usage?.cachedReadTokens ?? undefined;
  const thoughtTokens = usage?.thoughtTokens ?? undefined;

  const usageObj: OpenAIUsage = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  };
  if (cachedTokens !== undefined && cachedTokens > 0) {
    usageObj.prompt_tokens_details = { cached_tokens: cachedTokens };
  }
  if (thoughtTokens !== undefined && thoughtTokens > 0) {
    usageObj.completion_tokens_details = { reasoning_tokens: thoughtTokens };
  }
  return usageObj;
}

type MessageEntry = { role: string; content: string };

function toConversationLabel(role: string): string {
  switch (role) {
    case 'assistant':
      return 'Assistant';
    case 'system':
      return 'System';
    default:
      return 'User';
  }
}

function isMessageEntry(v: unknown): v is MessageEntry {
  if (typeof v !== 'object' || v === null) return false;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const rec = v as Record<string, unknown>;
  const role = rec['role'];
  const content = rec['content'];
  return typeof role === 'string' && typeof content === 'string';
}

/**
 * Adapter for OpenAI Chat Completions API format.
 *
 * Request:
 * ```json
 * {
 *   "model": "gemini-2.5-pro",
 *   "messages": [
 *     { "role": "system", "content": "Be helpful" },
 *     { "role": "user", "content": "Hello" }
 *   ],
 *   "stream": false
 * }
 * ```
 */
export class OpenAIAdapter implements FormatAdapter {
  readonly streamContentType = 'text/event-stream; charset=utf-8';

  parseRequest(body: unknown): NormalizedPromptRequest {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestError('Request body must be a JSON object.');
    }

    const b = body as OpenAIRequestBody;

    if (!Array.isArray(b.messages) || b.messages.length === 0) {
      throw new BadRequestError('"messages" must be a non-empty array.');
    }

    const messages: MessageEntry[] = b.messages.filter(isMessageEntry);
    if (messages.length === 0) {
      throw new BadRequestError(
        'Each message must have "role" and "content" string fields.',
      );
    }

    // Only lift leading system messages into the dedicated system prompt.
    // SillyTavern and other clients may inject system messages mid-conversation
    // (e.g. memory, context); those must stay in their original position.
    let conversationStart = 0;
    while (
      conversationStart < messages.length &&
      messages[conversationStart].role === 'system'
    ) {
      conversationStart += 1;
    }

    const systemMessages = messages.slice(0, conversationStart);
    const systemPrompt =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n')
        : undefined;

    // Preserve any later system messages inside the conversation history.
    const conversation = messages.slice(conversationStart);
    if (conversation.length === 0) {
      throw new BadRequestError(
        'Messages must contain at least one non-system message.',
      );
    }

    // Build prompt: if single user message, use directly; if multi-turn, format as conversation
    let prompt: string;
    if (conversation.length === 1 && conversation[0].role === 'user') {
      prompt = conversation[0].content;
    } else {
      prompt = conversation
        .map((m) => `${toConversationLabel(m.role)}: ${m.content}`)
        .join('\n');
    }

    if (!conversation.some((m) => m.content.trim().length > 0)) {
      throw new BadRequestError('Messages must contain non-empty content.');
    }

    // Model
    let model: string | undefined;
    if (typeof b.model === 'string' && b.model.trim().length > 0) {
      model = b.model;
    }

    // Generation configuration (max_tokens / max_completion_tokens, reasoning_effort -> thinkingLevel, temperature, top_p)
    let generationConfig: NormalizedGenerationConfig | undefined;

    const rawMaxTokens = b.max_completion_tokens ?? b.max_tokens;
    const maxOutputTokens =
      typeof rawMaxTokens === 'number' &&
      Number.isFinite(rawMaxTokens) &&
      rawMaxTokens > 0
        ? Math.floor(rawMaxTokens)
        : undefined;

    let thinkingConfig:
      | NormalizedGenerationConfig['thinkingConfig']
      | undefined;
    if (
      typeof b.reasoning_effort === 'string' &&
      b.reasoning_effort.trim().length > 0
    ) {
      const effort = b.reasoning_effort.trim().toLowerCase();
      let thinkingLevel: string | undefined;
      switch (effort) {
        case 'low':
          thinkingLevel = 'LOW';
          break;
        case 'high':
          thinkingLevel = 'HIGH';
          break;
        case 'medium':
          thinkingLevel = 'MEDIUM';
          break;
        case 'minimal':
          thinkingLevel = 'MINIMAL';
          break;
        default:
          thinkingLevel = effort.toUpperCase();
      }
      thinkingConfig = {
        thinkingLevel,
        includeThoughts: true,
      };
    }

    const rawTemp = b.temperature;
    const temperature =
      typeof rawTemp === 'number' && Number.isFinite(rawTemp)
        ? rawTemp
        : undefined;

    const rawTopP = b.top_p;
    const topP =
      typeof rawTopP === 'number' && Number.isFinite(rawTopP)
        ? rawTopP
        : undefined;

    if (
      maxOutputTokens !== undefined ||
      thinkingConfig !== undefined ||
      temperature !== undefined ||
      topP !== undefined
    ) {
      generationConfig = {
        ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
        ...(thinkingConfig !== undefined ? { thinkingConfig } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(topP !== undefined ? { topP } : {}),
      };
    }

    return {
      prompt,
      systemPrompt,
      model,
      ...(generationConfig ? { generationConfig } : {}),
    };
  }

  wantsStream(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) return false;
    return (body as OpenAIRequestBody).stream === true;
  }

  buildJsonResponse(
    assistantText: string,
    model: string,
    requestId: string,
    usage?: UsageInfo,
  ): OpenAIResponse {
    return {
      id: requestId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: assistantText },
          finish_reason: 'stop',
        },
      ],
      usage: buildOpenAiUsage(usage),
    };
  }

  buildJsonError(
    message: string,
    _status: number,
    _model: string,
    _requestId: string,
  ): unknown {
    return {
      error: {
        message,
        type: 'server_error',
        code: null,
      },
    };
  }

  formatStreamChunk(
    content: string,
    model: string,
    requestId: string,
    isFirst: boolean,
  ): string {
    const delta: Partial<{ role: string; content: string }> = { content };
    if (isFirst) {
      delta.role = 'assistant';
    }
    const chunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta,
          finish_reason: null,
        },
      ],
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  formatStreamEnd(model: string, requestId: string, usage?: UsageInfo): string {
    const chunk: OpenAIStreamResponse = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
      usage: buildOpenAiUsage(usage),
    };
    return `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`;
  }

  formatStreamError(message: string, model: string, requestId: string): string {
    const chunk = {
      id: requestId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: { content: `\n[Error: ${message}]` },
          finish_reason: 'stop',
        },
      ],
    };
    return `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`;
  }
}

export const openaiAdapter = new OpenAIAdapter();
