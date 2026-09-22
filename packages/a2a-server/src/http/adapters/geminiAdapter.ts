/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import type {
  FormatAdapter,
  NormalizedPromptRequest,
  NormalizedGenerationConfig,
  GeminiPart,
  GeminiContent,
  GeminiRequestBody,
  GeminiResponse,
  UsageInfo,
} from './types.js';

class BadRequestError extends Error {}

function buildGeminiUsageMetadata(
  usage?: UsageInfo,
): GeminiResponse['usageMetadata'] | undefined {
  if (!usage) return undefined;
  const promptTokenCount = usage.inputTokens;
  const candidatesTokenCount = usage.outputTokens;
  const totalTokenCount =
    usage.totalTokens || promptTokenCount + candidatesTokenCount;
  const metadata: NonNullable<GeminiResponse['usageMetadata']> = {
    promptTokenCount,
    candidatesTokenCount,
    totalTokenCount,
  };
  if (usage.cachedReadTokens != null && usage.cachedReadTokens > 0) {
    metadata.cachedContentTokenCount = usage.cachedReadTokens;
  }
  if (usage.thoughtTokens != null && usage.thoughtTokens > 0) {
    metadata.thoughtsTokenCount = usage.thoughtTokens;
  }
  return metadata;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isGeminiPart(p: unknown): p is GeminiPart {
  if (!isRecord(p)) return false;
  const rawText = p['text'];
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
  return isRecord(v) && Array.isArray(v['parts']);
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
    if (!isRecord(body)) {
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
    if (isRecord(genConfig)) {
      const configModel = genConfig['model'];
      if (typeof configModel === 'string') {
        model = configModel;
      }
    }
    if (!model && typeof b.model === 'string' && b.model.trim().length > 0) {
      model = b.model;
    }

    // Generation configuration (maxOutputTokens, thinkingConfig.thinkingLevel, temperature, etc.)
    let generationConfig: NormalizedGenerationConfig | undefined;
    const rawGenConfig = isRecord(b.generationConfig)
      ? b.generationConfig
      : undefined;

    const rawMaxTokens =
      rawGenConfig?.['maxOutputTokens'] ?? body['maxOutputTokens'];
    const maxOutputTokens =
      typeof rawMaxTokens === 'number' &&
      Number.isFinite(rawMaxTokens) &&
      rawMaxTokens > 0
        ? Math.floor(rawMaxTokens)
        : undefined;

    const candidateThinkingConfig =
      rawGenConfig?.['thinkingConfig'] ?? body['thinkingConfig'];
    const rawThinkingConfig = isRecord(candidateThinkingConfig)
      ? candidateThinkingConfig
      : undefined;

    let thinkingConfig:
      | NormalizedGenerationConfig['thinkingConfig']
      | undefined;
    if (rawThinkingConfig) {
      const rawThinkingLevel = rawThinkingConfig['thinkingLevel'];
      const thinkingLevel =
        typeof rawThinkingLevel === 'string' &&
        rawThinkingLevel.trim().length > 0
          ? rawThinkingLevel.trim().toUpperCase()
          : undefined;

      const rawIncludeThoughts = rawThinkingConfig['includeThoughts'];
      const includeThoughts =
        typeof rawIncludeThoughts === 'boolean' ? rawIncludeThoughts : true;

      if (thinkingLevel !== undefined) {
        thinkingConfig = {
          thinkingLevel,
          includeThoughts,
        };
      }
    }

    const rawTemp = rawGenConfig?.['temperature'] ?? body['temperature'];
    const temperature =
      typeof rawTemp === 'number' && Number.isFinite(rawTemp)
        ? rawTemp
        : undefined;

    const rawTopP = rawGenConfig?.['topP'] ?? body['topP'];
    const topP =
      typeof rawTopP === 'number' && Number.isFinite(rawTopP)
        ? rawTopP
        : undefined;

    const rawTopK = rawGenConfig?.['topK'] ?? body['topK'];
    const topK =
      typeof rawTopK === 'number' && Number.isFinite(rawTopK)
        ? Math.floor(rawTopK)
        : undefined;

    if (
      maxOutputTokens !== undefined ||
      thinkingConfig !== undefined ||
      temperature !== undefined ||
      topP !== undefined ||
      topK !== undefined
    ) {
      generationConfig = {
        ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
        ...(thinkingConfig !== undefined ? { thinkingConfig } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(topP !== undefined ? { topP } : {}),
        ...(topK !== undefined ? { topK } : {}),
      };
    }

    return {
      prompt,
      systemPrompt,
      model,
      ...(generationConfig ? { generationConfig } : {}),
    };
  }

  wantsStream(): boolean {
    return false; // Determined by route, not body
  }

  buildJsonResponse(
    assistantText: string,
    model: string,
    _requestId: string,
    usage?: UsageInfo,
  ): GeminiResponse {
    const res: GeminiResponse = {
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
    const usageMetadata = buildGeminiUsageMetadata(usage);
    if (usageMetadata) {
      res.usageMetadata = usageMetadata;
    }
    return res;
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

  formatStreamEnd(
    model: string,
    _requestId: string,
    usage?: UsageInfo,
  ): string {
    const chunk: {
      candidates: Array<{
        content: { parts: Array<{ text: string }>; role: string };
        finishReason: string;
      }>;
      modelVersion: string;
      usageMetadata?: GeminiResponse['usageMetadata'];
    } = {
      candidates: [
        {
          content: { parts: [{ text: '' }], role: 'model' },
          finishReason: 'STOP',
        },
      ],
      modelVersion: model,
    };
    const usageMetadata = buildGeminiUsageMetadata(usage);
    if (usageMetadata) {
      chunk.usageMetadata = usageMetadata;
    }
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
