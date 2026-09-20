/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import { describe, it, expect } from 'vitest';
import { openaiAdapter } from './openaiAdapter.js';
import { geminiAdapter } from './geminiAdapter.js';
import type { UsageInfo } from './types.js';

describe('Adapters token usage and cache hit reporting', () => {
  const sampleUsage: UsageInfo = {
    inputTokens: 1200,
    outputTokens: 150,
    totalTokens: 1350,
    cachedReadTokens: 1000,
    thoughtTokens: 80,
  };

  describe('OpenAI Adapter', () => {
    it('formats non-streaming JSON response with full token usage and cache details', () => {
      const response = openaiAdapter.buildJsonResponse(
        'Test answer',
        'gemini-2.5-pro',
        'req-123',
        sampleUsage,
      );

      expect(response.id).toBe('req-123');
      expect(response.choices[0].message.content).toBe('Test answer');
      expect(response.usage).toEqual({
        prompt_tokens: 1200,
        completion_tokens: 150,
        total_tokens: 1350,
        prompt_tokens_details: {
          cached_tokens: 1000,
        },
        completion_tokens_details: {
          reasoning_tokens: 80,
        },
      });
    });

    it('falls back gracefully to 0 tokens when usage is not provided', () => {
      const response = openaiAdapter.buildJsonResponse(
        'Test answer',
        'gemini-2.5-flash',
        'req-456',
      );

      expect(response.usage).toEqual({
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      });
    });

    it('formats streaming finish chunk with token usage and cache details', () => {
      const streamEnd = openaiAdapter.formatStreamEnd(
        'gemini-2.5-pro',
        'req-789',
        sampleUsage,
      );

      expect(streamEnd).toContain('data: [DONE]\n\n');
      const lines = streamEnd.split('\n\n').filter(Boolean);
      expect(lines.length).toBe(2);

      const firstData = lines[0].replace(/^data: /, '');
      const chunk = JSON.parse(firstData) as {
        id: string;
        choices: Array<{ finish_reason: string }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          prompt_tokens_details?: { cached_tokens: number };
          completion_tokens_details?: { reasoning_tokens: number };
        };
      };

      expect(chunk.choices[0].finish_reason).toBe('stop');
      expect(chunk.usage).toBeDefined();
      expect(chunk.usage?.prompt_tokens).toBe(1200);
      expect(chunk.usage?.completion_tokens).toBe(150);
      expect(chunk.usage?.total_tokens).toBe(1350);
      expect(chunk.usage?.prompt_tokens_details?.cached_tokens).toBe(1000);
      expect(chunk.usage?.completion_tokens_details?.reasoning_tokens).toBe(80);
    });
  });

  describe('Gemini Adapter', () => {
    it('formats non-streaming JSON response with usageMetadata including cachedContentTokenCount', () => {
      const response = geminiAdapter.buildJsonResponse(
        'Test answer',
        'gemini-2.5-pro',
        'req-123',
        sampleUsage,
      );

      expect(response.candidates[0].content.parts[0].text).toBe('Test answer');
      expect(response.usageMetadata).toEqual({
        promptTokenCount: 1200,
        candidatesTokenCount: 150,
        totalTokenCount: 1350,
        cachedContentTokenCount: 1000,
        thoughtsTokenCount: 80,
      });
    });

    it('does not include usageMetadata when usage is not provided', () => {
      const response = geminiAdapter.buildJsonResponse(
        'Test answer',
        'gemini-2.5-flash',
        'req-456',
      );

      expect(response.usageMetadata).toBeUndefined();
    });

    it('formats streaming finish chunk with usageMetadata', () => {
      const streamEnd = geminiAdapter.formatStreamEnd(
        'gemini-2.5-pro',
        'req-789',
        sampleUsage,
      );

      const raw = streamEnd.trim().replace(/^data: /, '');
      const chunk = JSON.parse(raw) as {
        candidates: Array<{ finishReason: string }>;
        usageMetadata?: {
          promptTokenCount: number;
          candidatesTokenCount: number;
          totalTokenCount: number;
          cachedContentTokenCount?: number;
          thoughtsTokenCount?: number;
        };
      };

      expect(chunk.candidates[0].finishReason).toBe('STOP');
      expect(chunk.usageMetadata).toEqual({
        promptTokenCount: 1200,
        candidatesTokenCount: 150,
        totalTokenCount: 1350,
        cachedContentTokenCount: 1000,
        thoughtsTokenCount: 80,
      });
    });
  });
});
