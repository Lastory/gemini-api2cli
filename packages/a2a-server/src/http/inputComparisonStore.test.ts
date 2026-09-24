/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import { describe, expect, it } from 'vitest';
import { InputComparisonStore } from './inputComparisonStore.js';

describe('InputComparisonStore', () => {
  it('returns hasEnoughData=false when empty', () => {
    const store = new InputComparisonStore();
    const result = store.getComparison();

    expect(result.hasEnoughData).toBe(false);
    expect(result.prefixLength).toBe(0);
    expect(result.commonPrefix).toBe('');
    expect(result.previousRemainder).toBe('');
    expect(result.latestRemainder).toBe('');
    expect(result.previous).toBeUndefined();
    expect(result.latest).toBeUndefined();
  });

  it('returns hasEnoughData=false when only one input is recorded', () => {
    const store = new InputComparisonStore();
    store.recordInput({
      id: 'req-1',
      model: 'gemini-2.5-pro',
      text: 'First request input text',
      timestamp: 1000,
    });

    const result = store.getComparison();
    expect(result.hasEnoughData).toBe(false);
    expect(result.previous).toBeUndefined();
    expect(result.latest).toEqual({
      id: 'req-1',
      model: 'gemini-2.5-pro',
      charCount: 24,
      timestamp: 1000,
    });
  });

  it('correctly calculates longest common prefix and divergence remainders', () => {
    const store = new InputComparisonStore();
    store.recordInput({
      id: 'req-1',
      model: 'gemini-2.5-pro',
      text: 'System instruction: you are helpful.\nUser: write a poem.',
      timestamp: 1000,
    });
    store.recordInput({
      id: 'req-2',
      model: 'gemini-2.5-flash',
      text: 'System instruction: you are helpful.\nUser: write an essay.',
      timestamp: 2000,
    });

    const result = store.getComparison();
    expect(result.hasEnoughData).toBe(true);

    const expectedPrefix =
      'System instruction: you are helpful.\nUser: write a';
    expect(result.prefixLength).toBe(expectedPrefix.length);
    expect(result.commonPrefix).toBe(expectedPrefix);
    expect(result.previousRemainder).toBe(' poem.');
    expect(result.latestRemainder).toBe('n essay.');
    expect(result.previous?.id).toBe('req-1');
    expect(result.previous?.model).toBe('gemini-2.5-pro');
    expect(result.latest?.id).toBe('req-2');
    expect(result.latest?.model).toBe('gemini-2.5-flash');
    expect(result.matchPercentage).toBeGreaterThan(0);
  });

  it('handles 100% identical inputs', () => {
    const store = new InputComparisonStore();
    const text = 'Exact same input content.';
    store.recordInput({ id: 'req-1', model: 'gemini-2.5-pro', text });
    store.recordInput({ id: 'req-2', model: 'gemini-2.5-pro', text });

    const result = store.getComparison();
    expect(result.hasEnoughData).toBe(true);
    expect(result.prefixLength).toBe(text.length);
    expect(result.commonPrefix).toBe(text);
    expect(result.previousRemainder).toBe('');
    expect(result.latestRemainder).toBe('');
    expect(result.matchPercentage).toBe(100);
  });

  it('handles completely divergent inputs (diverges at first character)', () => {
    const store = new InputComparisonStore();
    store.recordInput({ id: 'req-1', model: 'gemini-2.5-pro', text: 'Alpha' });
    store.recordInput({ id: 'req-2', model: 'gemini-2.5-pro', text: 'Beta' });

    const result = store.getComparison();
    expect(result.hasEnoughData).toBe(true);
    expect(result.prefixLength).toBe(0);
    expect(result.commonPrefix).toBe('');
    expect(result.previousRemainder).toBe('Alpha');
    expect(result.latestRemainder).toBe('Beta');
    expect(result.matchPercentage).toBe(0);
  });

  it('handles Chinese and multi-byte characters accurately', () => {
    const store = new InputComparisonStore();
    const prev =
      '系统指令：你是一个优秀的代码助手。\n用户：请用 TypeScript 实现快排';
    const latest =
      '系统指令：你是一个优秀的代码助手。\n用户：请用 TypeScript 实现归并排序';

    store.recordInput({ id: 'req-1', model: 'gemini-2.5-flash', text: prev });
    store.recordInput({ id: 'req-2', model: 'gemini-2.5-flash', text: latest });

    const result = store.getComparison();
    const common =
      '系统指令：你是一个优秀的代码助手。\n用户：请用 TypeScript 实现';

    expect(result.hasEnoughData).toBe(true);
    expect(result.prefixLength).toBe(common.length);
    expect(result.commonPrefix).toBe(common);
    expect(result.previousRemainder).toBe('快排');
    expect(result.latestRemainder).toBe('归并排序');
  });

  it('maintains a sliding window of only the latest 2 inputs', () => {
    const store = new InputComparisonStore();

    store.recordInput({ id: 'req-1', model: 'm1', text: 'Input 1' });
    store.recordInput({ id: 'req-2', model: 'm2', text: 'Input 2: Hello' });
    store.recordInput({ id: 'req-3', model: 'm3', text: 'Input 2: World' });

    const records = store.getRecords();
    expect(records.previous?.id).toBe('req-2');
    expect(records.latest?.id).toBe('req-3');

    const result = store.getComparison();
    expect(result.previous?.id).toBe('req-2');
    expect(result.latest?.id).toBe('req-3');
    expect(result.commonPrefix).toBe('Input 2: ');
    expect(result.previousRemainder).toBe('Hello');
    expect(result.latestRemainder).toBe('World');
  });

  it('clears stored records upon clear()', () => {
    const store = new InputComparisonStore();
    store.recordInput({ id: 'req-1', model: 'm1', text: 'Input 1' });
    store.recordInput({ id: 'req-2', model: 'm2', text: 'Input 2' });

    expect(store.getComparison().hasEnoughData).toBe(true);

    store.clear();
    const afterClear = store.getComparison();
    expect(afterClear.hasEnoughData).toBe(false);
    expect(afterClear.previous).toBeUndefined();
    expect(afterClear.latest).toBeUndefined();
  });
});
