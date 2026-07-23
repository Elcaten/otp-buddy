import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {mockBrowser} from '../../__mocks__/webextension-polyfill';
import type {Email} from '../../types/email';
import {useFillOtp} from './fill-otp-button';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});

describe('useFillOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockBrowser.tabs.query).mockResolvedValue([{id: 123}] as never);
    vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({success: true} as never);
  });

  test('starts pending', () => {
    const {result} = renderHook(() => useFillOtp());

    expect(result.current.state).toBe('pending');
    expect(result.current.stateDescription).toBeUndefined();
  });

  test('fills OTP on the active tab and reports success', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };

    const {result} = renderHook(() => useFillOtp());

    await act(async () => {
      await result.current.trigger(email);
    });

    expect(mockBrowser.tabs.query).toHaveBeenCalledWith({active: true, currentWindow: true});
    expect(mockBrowser.tabs.sendMessage).toHaveBeenCalledWith(123, {
      type: 'FILL_OTP',
      code: '641481',
    });
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

    const {result} = renderHook(() => useFillOtp());

    act(() => {
      void result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('Empty email');
    expect(mockBrowser.tabs.sendMessage).not.toHaveBeenCalled();
  });

  test('shows content script error when fill fails', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };
    vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({success: false, error: 'OTP input not found'} as never);

    const {result} = renderHook(() => useFillOtp());

    await act(async () => {
      await result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('OTP input not found');
  });

  test('shows a friendly error when the tab has no receiving content script', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };
    vi.mocked(mockBrowser.tabs.sendMessage).mockRejectedValue(
      new Error('Could not establish connection. Receiving end does not exist.')
    );

    const {result} = renderHook(() => useFillOtp());

    await act(async () => {
      await result.current.trigger(email);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.stateDescription).toBe('Open a website tab first');
  });
});
