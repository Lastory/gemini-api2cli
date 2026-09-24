/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

export interface InputRecord {
  id: string;
  timestamp: number;
  model: string;
  text: string;
  charCount: number;
}

export interface InputComparisonMeta {
  id: string;
  timestamp: number;
  model: string;
  charCount: number;
}

export interface InputComparisonResult {
  hasEnoughData: boolean;
  prefixLength: number;
  matchPercentage: number;
  commonPrefix: string;
  previousRemainder: string;
  latestRemainder: string;
  previous?: InputComparisonMeta;
  latest?: InputComparisonMeta;
}

export class InputComparisonStore {
  private previous: InputRecord | null = null;
  private latest: InputRecord | null = null;

  /**
   * Record a new request input.
   * Promotes the current latest record to previous, and saves the new input as latest.
   * Only the two most recent inputs are retained.
   */
  recordInput(params: {
    id: string;
    model: string;
    text: string;
    timestamp?: number;
  }): void {
    this.previous = this.latest;
    this.latest = {
      id: params.id,
      model: params.model,
      text: params.text,
      timestamp: params.timestamp ?? Date.now(),
      charCount: params.text.length,
    };
  }

  /**
   * Compare the latest and second-latest inputs to compute:
   * 1. Longest Common Prefix (LCP) in character length.
   * 2. The common prefix string.
   * 3. Divergence remainders for both previous and latest inputs.
   */
  getComparison(): InputComparisonResult {
    if (!this.previous || !this.latest) {
      return {
        hasEnoughData: false,
        prefixLength: 0,
        matchPercentage: 0,
        commonPrefix: '',
        previousRemainder: '',
        latestRemainder: '',
        previous: this.previous
          ? {
              id: this.previous.id,
              timestamp: this.previous.timestamp,
              model: this.previous.model,
              charCount: this.previous.charCount,
            }
          : undefined,
        latest: this.latest
          ? {
              id: this.latest.id,
              timestamp: this.latest.timestamp,
              model: this.latest.model,
              charCount: this.latest.charCount,
            }
          : undefined,
      };
    }

    const prevText = this.previous.text;
    const latestText = this.latest.text;
    const minLen = Math.min(prevText.length, latestText.length);

    let prefixLen = 0;
    while (
      prefixLen < minLen &&
      prevText.charCodeAt(prefixLen) === latestText.charCodeAt(prefixLen)
    ) {
      prefixLen++;
    }

    const maxLen = Math.max(prevText.length, latestText.length);
    const matchPercentage =
      maxLen > 0 ? Math.round((prefixLen / maxLen) * 1000) / 10 : 100;

    return {
      hasEnoughData: true,
      prefixLength: prefixLen,
      matchPercentage,
      commonPrefix: latestText.slice(0, prefixLen),
      previousRemainder: prevText.slice(prefixLen),
      latestRemainder: latestText.slice(prefixLen),
      previous: {
        id: this.previous.id,
        timestamp: this.previous.timestamp,
        model: this.previous.model,
        charCount: this.previous.charCount,
      },
      latest: {
        id: this.latest.id,
        timestamp: this.latest.timestamp,
        model: this.latest.model,
        charCount: this.latest.charCount,
      },
    };
  }

  /**
   * Reset and clear stored inputs.
   */
  clear(): void {
    this.previous = null;
    this.latest = null;
  }

  /**
   * Get raw records (primarily for testing and inspection).
   */
  getRecords(): {
    previous: InputRecord | null;
    latest: InputRecord | null;
  } {
    return {
      previous: this.previous ? { ...this.previous } : null,
      latest: this.latest ? { ...this.latest } : null,
    };
  }
}
