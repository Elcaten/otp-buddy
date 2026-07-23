import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import emailParserConfigJson from '../../email-parser/email-parser-config.json';
import type {EmailParserConfig} from '../../email-parser/email-parser-config';
import {EmailParser} from '../../email-parser/email-parser';
import type {Email} from '../../types/email';
import {useCopyOTPToClipboard} from './copy-opt-button';

const emailParser = new EmailParser(emailParserConfigJson as EmailParserConfig);

describe('useCopyOTPToClipboard', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {writeText: mockWriteText.mockResolvedValue(undefined)},
    });
  });

  test('starts pending', () => {
    const {result} = renderHook(() => useCopyOTPToClipboard(emailParser));

    expect(result.current.state).toBe('pending');
    expect(result.current.stateDescription).toBeUndefined();
  });

  test('copies OTP to clipboard and reports success', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };

    const {result} = renderHook(() => useCopyOTPToClipboard(emailParser));

    await act(async () => {
      await result.current.trigger(email);
    });

    expect(mockWriteText).toHaveBeenCalledWith('641481');
    expect(result.current.state).toBe('success');
    expect(result.current.stateDescription).toBeUndefined();
  });

  test('shows error when email has no content', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: undefined,
    };

    const {result} = renderHook(() => useCopyOTPToClipboard(emailParser));

    act(() => {
      void result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('Empty email');
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  test('shows error when no parser matches', () => {
    const email: Email = {
      id: '1',
      subject: 'Hello',
      from: [],
      content: '<p>No OTP here</p>',
    };

    const {result} = renderHook(() => useCopyOTPToClipboard(emailParser));

    act(() => {
      void result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('Parser not found');
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  test('shows error when parser matches but extraction fails', () => {
    const email: Email = {
      id: '1',
      subject: 'Hello',
      from: [{email: 'user@gmail.com'}],
      content: '<p>No OTP here</p>',
    };

    const {result} = renderHook(() => useCopyOTPToClipboard(emailParser));

    act(() => {
      void result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('Parser error: not-found');
    expect(mockWriteText).not.toHaveBeenCalled();
  });
});
