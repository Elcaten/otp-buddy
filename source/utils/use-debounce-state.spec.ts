import {describe, test, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useDebounceState} from './use-debounce-state';

describe('useDebounceState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns initial value for both value and debounced', () => {
    const {result} = renderHook(() => useDebounceState('initial', 300));
    expect(result.current[0].value).toBe('initial');
    expect(result.current[0].debounced).toBe('initial');
  });

  test('debounced updates after delay (trailing)', () => {
    const {result} = renderHook(() => useDebounceState('initial', 300));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0].value).toBe('updated');
    expect(result.current[0].debounced).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current[0].debounced).toBe('updated');
  });

  test('with trailing: false, debounced does not update after delay', () => {
    const {result} = renderHook(() =>
      useDebounceState('initial', {delay: 300, trailing: false})
    );

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current[0].debounced).toBe('initial');
  });

  test('accepts number for delay option', () => {
    const {result} = renderHook(() => useDebounceState(0, 100));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0].debounced).toBe(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current[0].debounced).toBe(42);
  });
});
