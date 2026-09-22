/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import { describe, it, expect } from 'vitest';
import { geminiAdapter } from './geminiAdapter.js';
import { openaiAdapter } from './openaiAdapter.js';

describe('Generation config parsing', () => {
  describe('Gemini Adapter', () => {
    it('parses maxOutputTokens and thinkingConfig with thinkingLevel', () => {
      const parsed = geminiAdapter.parseRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 16000,
          thinkingConfig: {
            thinkingLevel: 'low',
            includeThoughts: true,
          },
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      });

      expect(parsed.generationConfig).toEqual({
        maxOutputTokens: 16000,
        thinkingConfig: {
          thinkingLevel: 'LOW',
          includeThoughts: true,
        },
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      });
    });

    it('handles uppercase thinkingLevel and defaults includeThoughts to true', () => {
      const parsed = geminiAdapter.parseRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingLevel: 'HIGH',
          },
        },
      });

      expect(parsed.generationConfig).toEqual({
        maxOutputTokens: 8192,
        thinkingConfig: {
          thinkingLevel: 'HIGH',
          includeThoughts: true,
        },
      });
    });

    it('respects includeThoughts when explicitly set to false', () => {
      const parsed = geminiAdapter.parseRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        generationConfig: {
          thinkingConfig: {
            thinkingLevel: 'LOW',
            includeThoughts: false,
          },
        },
      });

      expect(parsed.generationConfig).toEqual({
        thinkingConfig: {
          thinkingLevel: 'LOW',
          includeThoughts: false,
        },
      });
    });

    it('returns undefined generationConfig when none provided', () => {
      const parsed = geminiAdapter.parseRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      });

      expect(parsed.generationConfig).toBeUndefined();
    });
  });

  describe('OpenAI Adapter', () => {
    it('parses max_tokens and reasoning_effort low into maxOutputTokens and thinkingLevel LOW', () => {
      const parsed = openaiAdapter.parseRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 16000,
        reasoning_effort: 'low',
        temperature: 0.5,
        top_p: 0.9,
      });

      expect(parsed.generationConfig).toEqual({
        maxOutputTokens: 16000,
        thinkingConfig: {
          thinkingLevel: 'LOW',
          includeThoughts: true,
        },
        temperature: 0.5,
        topP: 0.9,
      });
    });

    it('prefers max_completion_tokens over max_tokens', () => {
      const parsed = openaiAdapter.parseRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1000,
        max_completion_tokens: 2048,
        reasoning_effort: 'high',
      });

      expect(parsed.generationConfig).toEqual({
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingLevel: 'HIGH',
          includeThoughts: true,
        },
      });
    });

    it('maps reasoning_effort levels correctly', () => {
      const efforts = ['minimal', 'low', 'medium', 'high'] as const;
      for (const effort of efforts) {
        const parsed = openaiAdapter.parseRequest({
          messages: [{ role: 'user', content: 'Test' }],
          reasoning_effort: effort,
        });
        expect(parsed.generationConfig?.thinkingConfig?.thinkingLevel).toBe(
          effort.toUpperCase(),
        );
        expect(parsed.generationConfig?.thinkingConfig?.includeThoughts).toBe(
          true,
        );
      }
    });

    it('returns undefined generationConfig when none provided', () => {
      const parsed = openaiAdapter.parseRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(parsed.generationConfig).toBeUndefined();
    });
  });
});
