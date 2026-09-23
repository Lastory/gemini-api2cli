/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UsageInfo } from './adapters/types.js';

export type VertexServiceTier = 'standard' | 'flex' | 'priority';

export interface ModelRate {
  /** Price per 1M uncached input tokens (USD) */
  inputPricePer1M: number;
  /** Price per 1M cached input tokens (USD) */
  cachedInputPricePer1M: number;
  /** Price per 1M output tokens (including thinking tokens) (USD) */
  outputPricePer1M: number;
}

export interface TieredModelPricing {
  standard: {
    base: ModelRate;
    /** For models with a tiered context threshold (e.g. >200K tokens) */
    extended?: ModelRate;
    contextThreshold?: number;
  };
  flex?: {
    base: ModelRate;
    extended?: ModelRate;
    contextThreshold?: number;
  };
  priority?: {
    base: ModelRate;
    extended?: ModelRate;
    contextThreshold?: number;
  };
}

export interface VertexCostEstimateResult {
  model: string;
  matchedModelKey: string;
  serviceTier: VertexServiceTier;
  inputTokens: number;
  cachedTokens: number;
  uncachedInputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  billableOutputTokens: number;
  inputCostUsd: number;
  cachedCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

/**
 * Check if the given date is before or on the introductory pricing end date (2026-12-31).
 */
export function isIntroductoryPromoActive(now: Date = new Date()): boolean {
  const promoEnd = new Date('2026-12-31T23:59:59.999Z');
  return now.getTime() <= promoEnd.getTime();
}

/**
 * Official Vertex AI Pricing for pure-text and conversational generative models.
 * Rates in USD per 1,000,000 (1M) tokens.
 * Based on: https://cloud.google.com/vertex-ai/generative-ai/pricing
 */
export const VERTEX_TEXT_MODELS_PRICING: Record<string, TieredModelPricing> = {
  // ── Gemini 3 Pro ──
  'gemini-3.1-pro-preview': {
    standard: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 2.0,
        cachedInputPricePer1M: 0.2,
        outputPricePer1M: 12.0,
      },
      extended: {
        inputPricePer1M: 4.0,
        cachedInputPricePer1M: 0.4,
        outputPricePer1M: 18.0,
      },
    },
    flex: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 1.0,
        cachedInputPricePer1M: 0.1,
        outputPricePer1M: 6.0,
      },
      extended: {
        inputPricePer1M: 2.0,
        cachedInputPricePer1M: 0.2,
        outputPricePer1M: 9.0,
      },
    },
    priority: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 3.6,
        cachedInputPricePer1M: 0.36,
        outputPricePer1M: 21.6,
      },
      extended: {
        inputPricePer1M: 7.2,
        cachedInputPricePer1M: 0.72,
        outputPricePer1M: 32.4,
      },
    },
  },
  'gemini-3-pro-preview': {
    standard: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 2.0,
        cachedInputPricePer1M: 0.2,
        outputPricePer1M: 12.0,
      },
      extended: {
        inputPricePer1M: 4.0,
        cachedInputPricePer1M: 0.4,
        outputPricePer1M: 18.0,
      },
    },
    flex: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 1.0,
        cachedInputPricePer1M: 0.1,
        outputPricePer1M: 6.0,
      },
      extended: {
        inputPricePer1M: 2.0,
        cachedInputPricePer1M: 0.2,
        outputPricePer1M: 9.0,
      },
    },
    priority: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 3.6,
        cachedInputPricePer1M: 0.36,
        outputPricePer1M: 21.6,
      },
      extended: {
        inputPricePer1M: 7.2,
        cachedInputPricePer1M: 0.72,
        outputPricePer1M: 32.4,
      },
    },
  },

  // ── Gemini 3.8 / 3.7 / 3.6 Flash (Promotional pricing through Dec 31, 2026) ──
  'gemini-3.8-flash': {
    standard: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          }
        : {
            inputPricePer1M: 1.5,
            cachedInputPricePer1M: 0.15,
            outputPricePer1M: 7.5,
          },
    },
    flex: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.375,
            cachedInputPricePer1M: 0.0375,
            outputPricePer1M: 1.875,
          }
        : {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          },
    },
    priority: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 1.35,
            cachedInputPricePer1M: 0.135,
            outputPricePer1M: 6.75,
          }
        : {
            inputPricePer1M: 2.7,
            cachedInputPricePer1M: 0.27,
            outputPricePer1M: 13.5,
          },
    },
  },
  'gemini-3.7-flash': {
    standard: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          }
        : {
            inputPricePer1M: 1.5,
            cachedInputPricePer1M: 0.15,
            outputPricePer1M: 7.5,
          },
    },
    flex: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.375,
            cachedInputPricePer1M: 0.0375,
            outputPricePer1M: 1.875,
          }
        : {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          },
    },
    priority: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 1.35,
            cachedInputPricePer1M: 0.135,
            outputPricePer1M: 6.75,
          }
        : {
            inputPricePer1M: 2.7,
            cachedInputPricePer1M: 0.27,
            outputPricePer1M: 13.5,
          },
    },
  },
  'gemini-3.6-flash': {
    standard: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          }
        : {
            inputPricePer1M: 1.5,
            cachedInputPricePer1M: 0.15,
            outputPricePer1M: 7.5,
          },
    },
    flex: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 0.375,
            cachedInputPricePer1M: 0.0375,
            outputPricePer1M: 1.875,
          }
        : {
            inputPricePer1M: 0.75,
            cachedInputPricePer1M: 0.075,
            outputPricePer1M: 3.75,
          },
    },
    priority: {
      base: isIntroductoryPromoActive()
        ? {
            inputPricePer1M: 1.35,
            cachedInputPricePer1M: 0.135,
            outputPricePer1M: 6.75,
          }
        : {
            inputPricePer1M: 2.7,
            cachedInputPricePer1M: 0.27,
            outputPricePer1M: 13.5,
          },
    },
  },
  'gemini-3.8-flash-cyber': {
    standard: {
      base: {
        inputPricePer1M: 1.5,
        cachedInputPricePer1M: 0.15,
        outputPricePer1M: 7.5,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.75,
        cachedInputPricePer1M: 0.075,
        outputPricePer1M: 3.75,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 2.7,
        cachedInputPricePer1M: 0.27,
        outputPricePer1M: 13.5,
      },
    },
  },

  // ── Gemini 3.5 Flash & 3 Flash ──
  'gemini-3.5-flash': {
    standard: {
      base: {
        inputPricePer1M: 1.5,
        cachedInputPricePer1M: 0.15,
        outputPricePer1M: 9.0,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.75,
        cachedInputPricePer1M: 0.075,
        outputPricePer1M: 4.5,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 2.7,
        cachedInputPricePer1M: 0.27,
        outputPricePer1M: 16.2,
      },
    },
  },
  'gemini-3-flash-preview': {
    standard: {
      base: {
        inputPricePer1M: 0.5,
        cachedInputPricePer1M: 0.05,
        outputPricePer1M: 1.5,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.25,
        cachedInputPricePer1M: 0.025,
        outputPricePer1M: 1.5,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 0.9,
        cachedInputPricePer1M: 0.09,
        outputPricePer1M: 5.4,
      },
    },
  },

  // ── Gemini 3.5 & 3.1 Flash Lite ──
  'gemini-3.5-flash-lite': {
    standard: {
      base: {
        inputPricePer1M: 0.3,
        cachedInputPricePer1M: 0.03,
        outputPricePer1M: 2.5,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.15,
        cachedInputPricePer1M: 0.015,
        outputPricePer1M: 1.25,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 0.54,
        cachedInputPricePer1M: 0.054,
        outputPricePer1M: 4.5,
      },
    },
  },
  'gemini-3.1-flash-lite': {
    standard: {
      base: {
        inputPricePer1M: 0.25,
        cachedInputPricePer1M: 0.025,
        outputPricePer1M: 1.5,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.125,
        cachedInputPricePer1M: 0.0125,
        outputPricePer1M: 0.75,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 0.45,
        cachedInputPricePer1M: 0.045,
        outputPricePer1M: 2.7,
      },
    },
  },

  // ── Gemini 2.5 Pro ──
  'gemini-2.5-pro': {
    standard: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 1.25,
        cachedInputPricePer1M: 0.125,
        outputPricePer1M: 10.0,
      },
      extended: {
        inputPricePer1M: 2.5,
        cachedInputPricePer1M: 0.25,
        outputPricePer1M: 15.0,
      },
    },
    flex: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 0.625,
        cachedInputPricePer1M: 0.0625,
        outputPricePer1M: 5.0,
      },
      extended: {
        inputPricePer1M: 1.25,
        cachedInputPricePer1M: 0.125,
        outputPricePer1M: 7.5,
      },
    },
    priority: {
      contextThreshold: 200_000,
      base: {
        inputPricePer1M: 2.25,
        cachedInputPricePer1M: 0.225,
        outputPricePer1M: 18.0,
      },
      extended: {
        inputPricePer1M: 4.5,
        cachedInputPricePer1M: 0.45,
        outputPricePer1M: 27.0,
      },
    },
  },

  // ── Gemini 2.5 Flash & Flash Lite ──
  'gemini-2.5-flash': {
    standard: {
      base: {
        inputPricePer1M: 0.3,
        cachedInputPricePer1M: 0.03,
        outputPricePer1M: 2.5,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.15,
        cachedInputPricePer1M: 0.015,
        outputPricePer1M: 1.25,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 0.54,
        cachedInputPricePer1M: 0.054,
        outputPricePer1M: 4.5,
      },
    },
  },
  'gemini-2.5-flash-lite': {
    standard: {
      base: {
        inputPricePer1M: 0.1,
        cachedInputPricePer1M: 0.01,
        outputPricePer1M: 0.4,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.05,
        cachedInputPricePer1M: 0.005,
        outputPricePer1M: 0.2,
      },
    },
    priority: {
      base: {
        inputPricePer1M: 0.18,
        cachedInputPricePer1M: 0.018,
        outputPricePer1M: 0.72,
      },
    },
  },

  // ── Gemini 2.0 Flash & Flash Lite ──
  'gemini-2.0-flash': {
    standard: {
      base: {
        inputPricePer1M: 0.15,
        cachedInputPricePer1M: 0.0375,
        outputPricePer1M: 0.6,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.075,
        cachedInputPricePer1M: 0.01875,
        outputPricePer1M: 0.3,
      },
    },
  },
  'gemini-2.0-flash-lite': {
    standard: {
      base: {
        inputPricePer1M: 0.075,
        cachedInputPricePer1M: 0.01875,
        outputPricePer1M: 0.3,
      },
    },
    flex: {
      base: {
        inputPricePer1M: 0.0375,
        cachedInputPricePer1M: 0.009375,
        outputPricePer1M: 0.15,
      },
    },
  },

  // ── Gemini 1.5 Pro & Flash ──
  'gemini-1.5-pro': {
    standard: {
      contextThreshold: 128_000,
      base: {
        inputPricePer1M: 1.25,
        cachedInputPricePer1M: 0.3125,
        outputPricePer1M: 5.0,
      },
      extended: {
        inputPricePer1M: 2.5,
        cachedInputPricePer1M: 0.625,
        outputPricePer1M: 10.0,
      },
    },
  },
  'gemini-1.5-flash': {
    standard: {
      contextThreshold: 128_000,
      base: {
        inputPricePer1M: 0.075,
        cachedInputPricePer1M: 0.01875,
        outputPricePer1M: 0.3,
      },
      extended: {
        inputPricePer1M: 0.15,
        cachedInputPricePer1M: 0.0375,
        outputPricePer1M: 0.6,
      },
    },
  },
  'gemini-1.0-pro': {
    standard: {
      base: {
        inputPricePer1M: 0.5,
        cachedInputPricePer1M: 0.125,
        outputPricePer1M: 1.5,
      },
    },
  },

  // ── Gemma Open Models on Vertex AI ──
  'gemma-4-26b': {
    standard: {
      base: {
        inputPricePer1M: 0.15,
        cachedInputPricePer1M: 0.015,
        outputPricePer1M: 0.6,
      },
    },
  },
  'gemma-4-31b': {
    standard: {
      base: {
        inputPricePer1M: 0.2,
        cachedInputPricePer1M: 0.02,
        outputPricePer1M: 0.8,
      },
    },
  },
};

/**
 * Model aliases mapped to canonical keys in VERTEX_TEXT_MODELS_PRICING.
 */
const MODEL_ALIASES: Record<string, string> = {
  auto: 'gemini-2.5-pro',
  'auto-gemini-2.5': 'gemini-2.5-pro',
  'auto-gemini-3': 'gemini-3-pro-preview',
  pro: 'gemini-2.5-pro',
  flash: 'gemini-2.5-flash',
  'flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3-flash': 'gemini-3-flash-preview',
  'gemini-3-pro': 'gemini-3-pro-preview',
  'gemini-3.1-pro': 'gemini-3.1-pro-preview',
  'gemini-3.1-pro-preview-customtools': 'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview': 'gemini-3.1-flash-lite',
  'gemma-4-26b-a4b-it': 'gemma-4-26b',
  'gemma-4-31b-it': 'gemma-4-31b',
};

/**
 * Normalize and resolve a requested model string to a matching pricing key.
 */
export function resolveVertexPricingModel(rawModel: string): string {
  let model = rawModel.trim().toLowerCase();
  if (model.startsWith('models/')) {
    model = model.slice('models/'.length);
  }

  // Direct alias lookup
  if (MODEL_ALIASES[model]) {
    return MODEL_ALIASES[model];
  }

  // Exact match
  if (VERTEX_TEXT_MODELS_PRICING[model]) {
    return model;
  }

  // Version suffix stripping: e.g. gemini-2.5-pro-001 -> gemini-2.5-pro
  // or gemini-1.5-pro-preview-0409 -> gemini-1.5-pro
  for (const key of Object.keys(VERTEX_TEXT_MODELS_PRICING)) {
    if (model.startsWith(key)) {
      return key;
    }
  }

  // Suffix matching in reverse (e.g. gemini-2.5-flash matching gemini-2.5-flash)
  const sortedKeys = Object.keys(VERTEX_TEXT_MODELS_PRICING).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (model.includes(key)) {
      return key;
    }
  }

  // Default fallback: gemini-2.5-pro
  return 'gemini-2.5-pro';
}

/**
 * Estimate cost for a single request on Vertex AI.
 *
 * NOTE: As per Google Vertex AI official documentation:
 * "When thinking is turned on, response pricing is the sum of output tokens and thinking tokens."
 * Both output tokens and thinking tokens are billed at the model's output rate.
 */
export function estimateVertexCost(
  rawModel: string,
  usage?: UsageInfo,
  serviceTier: VertexServiceTier = 'standard',
): VertexCostEstimateResult {
  const matchedKey = resolveVertexPricingModel(rawModel);
  const pricingEntry = VERTEX_TEXT_MODELS_PRICING[matchedKey];

  const inputTokens = usage?.inputTokens ?? 0;
  const cachedTokens = Math.min(
    inputTokens,
    Math.max(0, usage?.cachedReadTokens ?? 0),
  );
  const uncachedInputTokens = Math.max(0, inputTokens - cachedTokens);

  const outputTokens = usage?.outputTokens ?? 0;
  const thoughtTokens = Math.max(0, usage?.thoughtTokens ?? 0);
  const billableOutputTokens = outputTokens + thoughtTokens;

  // Select tier pricing
  const tierConfig =
    (serviceTier === 'flex' && pricingEntry.flex) ||
    (serviceTier === 'priority' && pricingEntry.priority) ||
    pricingEntry.standard;

  // Check context threshold (e.g. > 200K tokens)
  let rate: ModelRate = tierConfig.base;
  if (
    tierConfig.contextThreshold &&
    tierConfig.extended &&
    inputTokens > tierConfig.contextThreshold
  ) {
    rate = tierConfig.extended;
  }

  const inputCostUsd = (uncachedInputTokens / 1_000_000) * rate.inputPricePer1M;
  const cachedCostUsd = (cachedTokens / 1_000_000) * rate.cachedInputPricePer1M;
  const outputCostUsd =
    (billableOutputTokens / 1_000_000) * rate.outputPricePer1M;

  const totalCostUsd = inputCostUsd + cachedCostUsd + outputCostUsd;

  return {
    model: rawModel,
    matchedModelKey: matchedKey,
    serviceTier,
    inputTokens,
    cachedTokens,
    uncachedInputTokens,
    outputTokens,
    thoughtTokens,
    billableOutputTokens,
    inputCostUsd,
    cachedCostUsd,
    outputCostUsd,
    totalCostUsd,
  };
}
