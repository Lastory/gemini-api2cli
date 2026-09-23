/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  estimateVertexCost,
  resolveVertexPricingModel,
  VERTEX_TEXT_MODELS_PRICING,
} from './vertexPricing.js';
import type { UsageInfo } from './adapters/types.js';

describe('Vertex AI Pricing & Cost Estimation', () => {
  describe('resolveVertexPricingModel', () => {
    it('resolves model aliases correctly', () => {
      expect(resolveVertexPricingModel('auto')).toBe('gemini-2.5-pro');
      expect(resolveVertexPricingModel('pro')).toBe('gemini-2.5-pro');
      expect(resolveVertexPricingModel('flash')).toBe('gemini-2.5-flash');
      expect(resolveVertexPricingModel('flash-lite')).toBe(
        'gemini-3.1-flash-lite',
      );
      expect(resolveVertexPricingModel('gemini-3.1-pro')).toBe(
        'gemini-3.1-pro-preview',
      );
      expect(
        resolveVertexPricingModel('gemini-3.1-pro-preview-customtools'),
      ).toBe('gemini-3.1-pro-preview');
    });

    it('strips "models/" prefix and trims whitespace', () => {
      expect(resolveVertexPricingModel('  models/gemini-2.5-pro  ')).toBe(
        'gemini-2.5-pro',
      );
      expect(resolveVertexPricingModel('models/gemini-3.5-flash')).toBe(
        'gemini-3.5-flash',
      );
    });

    it('matches versioned model names', () => {
      expect(resolveVertexPricingModel('gemini-2.5-pro-001')).toBe(
        'gemini-2.5-pro',
      );
      expect(resolveVertexPricingModel('gemini-1.5-pro-preview-0409')).toBe(
        'gemini-1.5-pro',
      );
      expect(resolveVertexPricingModel('gemini-2.5-flash-preview-02-05')).toBe(
        'gemini-2.5-flash',
      );
    });

    it('falls back to gemini-2.5-pro for unknown models', () => {
      expect(resolveVertexPricingModel('unknown-model-xyz')).toBe(
        'gemini-2.5-pro',
      );
    });
  });

  describe('estimateVertexCost - Output and Thinking tokens calculation', () => {
    it('calculates output cost summing BOTH output tokens and thinking tokens', () => {
      const usage: UsageInfo = {
        inputTokens: 0,
        outputTokens: 500,
        thoughtTokens: 1500,
        totalTokens: 2000,
      };

      const result = estimateVertexCost('gemini-2.5-pro', usage, 'standard');

      expect(result.outputTokens).toBe(500);
      expect(result.thoughtTokens).toBe(1500);
      expect(result.billableOutputTokens).toBe(2000);

      // gemini-2.5-pro standard output rate is $10.00 / 1M
      // 2000 / 1,000,000 * 10 = $0.02
      expect(result.outputCostUsd).toBeCloseTo(0.02, 6);
      expect(result.inputCostUsd).toBe(0);
      expect(result.cachedCostUsd).toBe(0);
      expect(result.totalCostUsd).toBeCloseTo(0.02, 6);
    });

    it('handles requests with only output tokens (no thinking)', () => {
      const usage: UsageInfo = {
        inputTokens: 0,
        outputTokens: 1000,
        totalTokens: 1000,
      };

      const result = estimateVertexCost('gemini-2.5-flash', usage, 'standard');

      expect(result.outputTokens).toBe(1000);
      expect(result.thoughtTokens).toBe(0);
      expect(result.billableOutputTokens).toBe(1000);

      // gemini-2.5-flash standard output rate is $2.50 / 1M
      // 1000 / 1,000,000 * 2.5 = $0.0025
      expect(result.outputCostUsd).toBeCloseTo(0.0025, 6);
    });
  });

  describe('estimateVertexCost - Cached vs Uncached Input tokens', () => {
    it('separates cached tokens from input tokens and applies cached rate', () => {
      const usage: UsageInfo = {
        inputTokens: 10_000,
        cachedReadTokens: 8_000,
        outputTokens: 0,
        totalTokens: 10_000,
      };

      const result = estimateVertexCost('gemini-2.5-pro', usage, 'standard');

      expect(result.uncachedInputTokens).toBe(2000);
      expect(result.cachedTokens).toBe(8000);

      // gemini-2.5-pro input is $1.25 / 1M, cached is $0.125 / 1M
      // uncached cost: 2000 / 1M * 1.25 = 0.0025
      // cached cost: 8000 / 1M * 0.125 = 0.001
      expect(result.inputCostUsd).toBeCloseTo(0.0025, 6);
      expect(result.cachedCostUsd).toBeCloseTo(0.001, 6);
      expect(result.totalCostUsd).toBeCloseTo(0.0035, 6);
    });
  });

  describe('estimateVertexCost - Service Tiers (Standard, Flex, Priority)', () => {
    const usage: UsageInfo = {
      inputTokens: 100_000,
      outputTokens: 100_000,
      thoughtTokens: 100_000,
      totalTokens: 300_000,
    };

    it('calculates cost accurately with Standard tier', () => {
      const result = estimateVertexCost('gemini-2.5-pro', usage, 'standard');
      // input 100k * $1.25 = $0.125
      // output (100k + 100k) = 200k * $10.0 = $2.00
      // total = $2.125
      expect(result.inputCostUsd).toBeCloseTo(0.125, 4);
      expect(result.outputCostUsd).toBeCloseTo(2.0, 4);
      expect(result.totalCostUsd).toBeCloseTo(2.125, 4);
    });

    it('calculates cost accurately with Flex tier (discounted)', () => {
      const result = estimateVertexCost('gemini-2.5-pro', usage, 'flex');
      // input 100k * $0.625 = $0.0625
      // output 200k * $5.00 = $1.00
      // total = $1.0625
      expect(result.inputCostUsd).toBeCloseTo(0.0625, 4);
      expect(result.outputCostUsd).toBeCloseTo(1.0, 4);
      expect(result.totalCostUsd).toBeCloseTo(1.0625, 4);
    });

    it('calculates cost accurately with Priority tier (surged)', () => {
      const result = estimateVertexCost('gemini-2.5-pro', usage, 'priority');
      // input 100k * $2.25 = $0.225
      // output 200k * $18.00 = $3.60
      // total = $3.825
      expect(result.inputCostUsd).toBeCloseTo(0.225, 4);
      expect(result.outputCostUsd).toBeCloseTo(3.6, 4);
      expect(result.totalCostUsd).toBeCloseTo(3.825, 4);
    });
  });

  describe('estimateVertexCost - Context Threshold Tier (>200K)', () => {
    it('applies extended pricing when input tokens exceed context threshold', () => {
      const usageUnder: UsageInfo = {
        inputTokens: 150_000,
        outputTokens: 10_000,
        totalTokens: 160_000,
      };
      const usageOver: UsageInfo = {
        inputTokens: 250_000,
        outputTokens: 10_000,
        totalTokens: 260_000,
      };

      const under = estimateVertexCost(
        'gemini-2.5-pro',
        usageUnder,
        'standard',
      );
      const over = estimateVertexCost('gemini-2.5-pro', usageOver, 'standard');

      // Under <= 200k: input $1.25/1M, output $10/1M
      // 150k * 1.25/1M = 0.1875, 10k * 10/1M = 0.10 -> 0.2875
      expect(under.totalCostUsd).toBeCloseTo(0.2875, 4);

      // Over > 200k: input $2.50/1M, output $15/1M
      // 250k * 2.50/1M = 0.625, 10k * 15/1M = 0.15 -> 0.775
      expect(over.totalCostUsd).toBeCloseTo(0.775, 4);
    });
  });

  describe('Model Coverage', () => {
    it('contains pricing for all required text models', () => {
      const expectedModels = [
        'gemini-3.1-pro-preview',
        'gemini-3-pro-preview',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3.8-flash-cyber',
        'gemini-3.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemma-4-26b',
        'gemma-4-31b',
      ];

      for (const model of expectedModels) {
        expect(VERTEX_TEXT_MODELS_PRICING[model]).toBeDefined();
        expect(
          VERTEX_TEXT_MODELS_PRICING[model].standard.base.inputPricePer1M,
        ).toBeGreaterThan(0);
        expect(
          VERTEX_TEXT_MODELS_PRICING[model].standard.base.outputPricePer1M,
        ).toBeGreaterThan(0);
      }
    });
  });
});
