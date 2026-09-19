/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import type {
  FormatAdapter,
  NormalizedPromptRequest,
  GeminiPart,
  GeminiContent,
  GeminiRequestBody,
} from './types.js';

class BadRequestError extends Error {}

function isGeminiPart(p: unknown): p is GeminiPart {
  if (typeof p !== 'object' || p === null) return false;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const rawText = (p as Record<string, unknown>)['text'];
  return typeof rawText === 'string';
}

function extractText(parts: unknown): string {
  if (!Array.isArray(parts)) return '';
  return parts
    .filter(isGeminiPart)
    .map((p) => p.text)
    .join('');
}

function toConversationLabel(role?: string): string {
  switch (role) {
    case 'model':
    case 'assistant':
      return 'Assistant';
    case 'system':
      return 'System';
    default:
      return 'User';
  }
}

function isGeminiContent(v: unknown): v is GeminiContent {
  return (
    typeof v === 'object' &&
    v !== null &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    Array.isArray((v as Record<string, unknown>)['parts'])
  );
}

/**
 * Adapter for Google Generative AI (Gemini) API format.
 *
 * Request:
 * ```json
 * {
 *   "contents": [{ "role": "user", "parts": [{ "text": "Hello" }] }],
 *   "systemInstruction": { "parts": [{ "text": "Be helpful" }] },
 *   "generationConfig": { "model": "gemini-2.5-pro" }
 * }
 * ```
 */
export class GeminiAdapter implements FormatAdapter {
  readonly streamContentType = 'text/event-stream; charset=utf-8';

  parseRequest(body: unknown): NormalizedPromptRequest {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestError('Request body must be a JSON object.');
    }

    const b = body as GeminiRequestBody;

    // Extract contents
    if (!Array.isArray(b.contents) || b.contents.length === 0) {
      throw new BadRequestError(
        '"contents" must be a non-empty array of content objects.',
      );
    }

    const contents = b.contents.filter(isGeminiContent);
    if (contents.length === 0) {
      throw new BadRequestError(
        'Each item in "contents" must have a "parts" array.',
      );
    }

    // Build prompt while preserving the original role of every turn.
    const conversation = contents.map((c) => ({
      role: c.role,
      text: extractText(c.parts),
    }));

    let prompt: string;
    if (
      conversation.length === 1 &&
      (conversation[0].role === undefined || conversation[0].role === 'user')
    ) {
      prompt = conversation[0].text;
    } else {
      prompt = conversation
        .map((c) => `${toConversationLabel(c.role)}: ${c.text}`)
        .join('\n');
    }

    if (!conversation.some((c) => c.text.trim().length > 0)) {
      throw new BadRequestError('Contents must contain non-empty text.');
    }

    // System instruction
    let systemPrompt: string | undefined;
    if (b.systemInstruction !== undefined) {
      if (isGeminiContent(b.systemInstruction)) {
        systemPrompt = extractText(b.systemInstruction.parts) || undefined;
      } else {
        throw new BadRequestError(
          '"systemInstruction" must have a "parts" array.',
        );
      }
    }

    // Model — from generationConfig.model or top-level model
    let model: string | undefined;
    const genConfig = b.generationConfig;
    if (typeof genConfig === 'object' && genConfig !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const configModel = (genConfig as Record<string, unknown>)['model'];
      if (typeof configModel === 'string') {
        model = configModel;
      }
    }
    if (!model && typeof b.model === 'string' && b.model.trim().length > 0) {
      model = b.model;
    }

    return { prompt, systemPrompt, model };
  }

  wantsStream(): boolean {
    return false; // Determined by route, not body
  }

  buildJsonResponse(
    assistantText: string,
    model: string,
    _requestId: string,
  ): unknown {
    return {
      candidates: [
        {
          content: {
            parts: [{ text: assistantText }],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
      modelVersion: model,
    };
  }

  buildJsonError(
    message: string,
    status: number,
    _model: string,
    _requestId: string,
  ): unknown {
    return {
      error: {
        code: status,
        message,
        status: status === 400 ? 'INVALID_ARGUMENT' : 'INTERNAL',
      },
    };
  }

  formatStreamChunk(
    content: string,
    model: string,
    _requestId: string,
    _isFirst: boolean,
  ): string {
    const chunk = {
      candidates: [
        {
          content: {
            parts: [{ text: content }],
            role: 'model',
          },
        },
      ],
      modelVersion: model,
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  formatStreamEnd(model: string, _requestId: string): string {
    const chunk = {
      candidates: [
        {
          content: { parts: [{ text: '' }], role: 'model' },
          finishReason: 'STOP',
        },
      ],
      modelVersion: model,
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  formatStreamError(
    message: string,
    _model: string,
    _requestId: string,
  ): string {
    const chunk = {
      error: { code: 500, message, status: 'INTERNAL' },
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }
}

export const geminiAdapter = new GeminiAdapter();
