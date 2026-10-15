/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { ModelMappingContentGenerator } from './modelMappingContentGenerator.js';
import type { ContentGenerator } from './contentGenerator.js';
import { LlmRole } from '../telemetry/llmRole.js';
import type { GenerateContentParameters } from '@google/genai';

describe('ModelMappingContentGenerator', () => {
  const mockMappings = {
    'gemini-3.5-flash': 'gemini-3-flash',
    'gemini-pro': 'gemini-1.5-pro',
  };

  it('delegates userTier, userTierName, and paidTier properties', () => {
    const mockWrapped = {
      userTier: 'free',
      userTierName: 'Free Tier',
      paidTier: { id: 'paid' },
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );

    expect(generator.userTier).toBe('free');
    expect(generator.userTierName).toBe('Free Tier');
    expect(generator.paidTier).toEqual({ id: 'paid' });
  });

  it('maps matching model without prefix', async () => {
    const mockWrapped = {
      generateContent: vi.fn().mockResolvedValue({}),
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );
    const req = { model: 'gemini-3.5-flash', contents: [] };

    await generator.generateContent(req, 'prompt-id', LlmRole.MAIN);

    expect(mockWrapped.generateContent).toHaveBeenCalledWith(
      { model: 'gemini-3-flash', contents: [] },
      'prompt-id',
      LlmRole.MAIN,
    );
  });

  it('maps matching model with models/ prefix', async () => {
    const mockWrapped = {
      generateContent: vi.fn().mockResolvedValue({}),
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );
    const req = { model: 'models/gemini-3.5-flash', contents: [] };

    await generator.generateContent(req, 'prompt-id', LlmRole.MAIN);

    expect(mockWrapped.generateContent).toHaveBeenCalledWith(
      { model: 'models/gemini-3-flash', contents: [] },
      'prompt-id',
      LlmRole.MAIN,
    );
  });

  it('leaves unmapped model unchanged', async () => {
    const mockWrapped = {
      generateContent: vi.fn().mockResolvedValue({}),
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );
    const req = { model: 'unknown-model', contents: [] };

    await generator.generateContent(req, 'prompt-id', LlmRole.MAIN);

    expect(mockWrapped.generateContent).toHaveBeenCalledWith(
      { model: 'unknown-model', contents: [] },
      'prompt-id',
      LlmRole.MAIN,
    );
  });

  it('leaves model with prefix unchanged if no match after normalization', async () => {
    const mockWrapped = {
      generateContent: vi.fn().mockResolvedValue({}),
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );
    const req = { model: 'models/unknown-model', contents: [] };

    await generator.generateContent(req, 'prompt-id', LlmRole.MAIN);

    expect(mockWrapped.generateContent).toHaveBeenCalledWith(
      { model: 'models/unknown-model', contents: [] },
      'prompt-id',
      LlmRole.MAIN,
    );
  });

  it('handles missing/undefined model property safely', async () => {
    const mockWrapped = {
      generateContent: vi.fn().mockResolvedValue({}),
    } as unknown as ContentGenerator;

    const generator = new ModelMappingContentGenerator(
      mockWrapped,
      mockMappings,
    );
    const req = { contents: [] } as unknown as GenerateContentParameters;

    await generator.generateContent(req, 'prompt-id', LlmRole.MAIN);

    expect(mockWrapped.generateContent).toHaveBeenCalledWith(
      { contents: [] },
      'prompt-id',
      LlmRole.MAIN,
    );
  });

  // [a2a-server-patch] BEGIN: Tests for Vertex AI model path qualification
  describe('Vertex AI model path qualification', () => {
    it('qualifies bare model name with projects and locations', async () => {
      const mockWrapped = {
        generateContentStream: vi.fn().mockResolvedValue({}),
      } as unknown as ContentGenerator;

      const generator = new ModelMappingContentGenerator(
        mockWrapped,
        {},
        {
          isVertexAI: true,
          project: 'xenodochial-watch-8phrv',
          location: 'global',
        },
      );

      const req = { model: 'gemini-4-argon', contents: [] };
      await generator.generateContentStream(req, 'prompt-id', LlmRole.MAIN);

      expect(mockWrapped.generateContentStream).toHaveBeenCalledWith(
        {
          model:
            'projects/xenodochial-watch-8phrv/locations/global/publishers/google/models/gemini-4-argon',
          contents: [],
        },
        'prompt-id',
        LlmRole.MAIN,
      );
    });

    it('strips existing models/ or publishers/google/models/ prefix before qualifying', async () => {
      const mockWrapped = {
        generateContent: vi.fn().mockResolvedValue({}),
      } as unknown as ContentGenerator;

      const generator = new ModelMappingContentGenerator(
        mockWrapped,
        {},
        {
          isVertexAI: true,
          project: 'my-project',
          location: 'us-central1',
        },
      );

      await generator.generateContent(
        { model: 'models/gemini-2.5-flash', contents: [] },
        'prompt-id',
        LlmRole.MAIN,
      );
      expect(mockWrapped.generateContent).toHaveBeenCalledWith(
        {
          model:
            'projects/my-project/locations/us-central1/publishers/google/models/gemini-2.5-flash',
          contents: [],
        },
        'prompt-id',
        LlmRole.MAIN,
      );

      await generator.generateContent(
        {
          model: 'publishers/google/models/gemini-2.5-pro',
          contents: [],
        },
        'prompt-id',
        LlmRole.MAIN,
      );
      expect(mockWrapped.generateContent).toHaveBeenCalledWith(
        {
          model:
            'projects/my-project/locations/us-central1/publishers/google/models/gemini-2.5-pro',
          contents: [],
        },
        'prompt-id',
        LlmRole.MAIN,
      );
    });

    it('preserves already fully qualified projects/... model string', async () => {
      const mockWrapped = {
        generateContent: vi.fn().mockResolvedValue({}),
      } as unknown as ContentGenerator;

      const generator = new ModelMappingContentGenerator(
        mockWrapped,
        {},
        {
          isVertexAI: true,
          project: 'my-project',
          location: 'global',
        },
      );

      const alreadyQualified =
        'projects/other-proj/locations/us/publishers/google/models/gemini-custom';
      await generator.generateContent(
        { model: alreadyQualified, contents: [] },
        'prompt-id',
        LlmRole.MAIN,
      );
      expect(mockWrapped.generateContent).toHaveBeenCalledWith(
        { model: alreadyQualified, contents: [] },
        'prompt-id',
        LlmRole.MAIN,
      );
    });

    it('does not qualify model if isVertexAI is false', async () => {
      const mockWrapped = {
        generateContent: vi.fn().mockResolvedValue({}),
      } as unknown as ContentGenerator;

      const generator = new ModelMappingContentGenerator(
        mockWrapped,
        {},
        {
          isVertexAI: false,
          project: 'my-project',
          location: 'global',
        },
      );

      await generator.generateContent(
        { model: 'gemini-2.5-flash', contents: [] },
        'prompt-id',
        LlmRole.MAIN,
      );
      expect(mockWrapped.generateContent).toHaveBeenCalledWith(
        { model: 'gemini-2.5-flash', contents: [] },
        'prompt-id',
        LlmRole.MAIN,
      );
    });
  });
  // [a2a-server-patch] END: Tests for Vertex AI model path qualification
});
