/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CountTokensResponse,
  type GenerateContentResponse,
  type GenerateContentParameters,
  type CountTokensParameters,
  type EmbedContentResponse,
  type EmbedContentParameters,
} from '@google/genai';
import { type ContentGenerator } from './contentGenerator.js';
import type { LlmRole } from '../telemetry/llmRole.js';
import type { UserTierId, GeminiUserTier } from '../code_assist/types.js';
import { normalizeModelId } from '../utils/modelUtils.js';

// [a2a-server-patch] BEGIN: Vertex AI model context
export interface VertexModelContext {
  isVertexAI: boolean;
  project?: string;
  location?: string;
}
// [a2a-server-patch] END: Vertex AI model context

export class ModelMappingContentGenerator implements ContentGenerator {
  constructor(
    private readonly wrapped: ContentGenerator,
    private readonly mappings:
      | Record<string, string>
      | (() => Record<string, string>),
    // [a2a-server-patch] Vertex AI project/location context for full resource path qualification
    private readonly vertexContext?: VertexModelContext,
  ) {}

  getWrapped(): ContentGenerator {
    return this.wrapped;
  }

  get userTier(): UserTierId | undefined {
    return this.wrapped.userTier;
  }

  get userTierName(): string | undefined {
    return this.wrapped.userTierName;
  }

  get paidTier(): GeminiUserTier | undefined {
    return this.wrapped.paidTier;
  }

  // [a2a-server-patch] BEGIN: Qualify Vertex AI model name with projects/locations
  private qualifyVertexModel(model: string): string {
    if (!this.vertexContext?.isVertexAI) return model;
    const { project, location } = this.vertexContext;
    if (!project || !location) return model;
    if (model.startsWith('projects/')) return model;

    let bareModel = model;
    if (bareModel.startsWith('publishers/google/models/')) {
      bareModel = bareModel.slice('publishers/google/models/'.length);
    } else if (bareModel.startsWith('models/')) {
      bareModel = bareModel.slice('models/'.length);
    }

    return `projects/${project}/locations/${location}/publishers/google/models/${bareModel}`;
  }
  // [a2a-server-patch] END: Qualify Vertex AI model name with projects/locations

  private mapModel<T extends { model?: string }>(req: T): T {
    if (req.model) {
      const activeMappings =
        typeof this.mappings === 'function' ? this.mappings() : this.mappings;
      const normalizedModel = normalizeModelId(req.model);
      const mappedModel = activeMappings[normalizedModel]
        ? req.model.startsWith('models/')
          ? `models/${activeMappings[normalizedModel]}`
          : activeMappings[normalizedModel]
        : req.model;

      // [a2a-server-patch] Apply Vertex AI resource path qualification
      const finalModel = this.qualifyVertexModel(mappedModel);

      if (finalModel !== req.model) {
        return {
          ...req,
          model: finalModel,
        };
      }
    }
    return req;
  }

  generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
    role: LlmRole,
  ): Promise<GenerateContentResponse> {
    return this.wrapped.generateContent(
      this.mapModel(request),
      userPromptId,
      role,
    );
  }

  generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
    role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.wrapped.generateContentStream(
      this.mapModel(request),
      userPromptId,
      role,
    );
  }

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    return this.wrapped.countTokens(this.mapModel(request));
  }

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    return this.wrapped.embedContent(this.mapModel(request));
  }
}
