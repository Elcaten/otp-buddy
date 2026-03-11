import {beforeEach, describe, expect, test, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {mockBrowser} from '../../__mocks__/webextension-polyfill';
import {FillOTPButton} from './fill-otp-button';
import type {Email} from '../../types/email';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});

describe('FillOTPButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockBrowser.tabs.query).mockResolvedValue([{id: 123}] as never);
    vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({success: true} as never);
  });

  test('renders Fill when pending', () => {
    const email: Email = {
      id: '1',
      subject: '123456 is your code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<html>641481</html>',
    };

    render(<FillOTPButton email={email} />);
    expect(screen.getByRole('button', {name: /fill/i})).toBeInTheDocument();
  });

  test('fills OTP on the active tab and shows Filled! on success', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };

    render(<FillOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /fill/i}));

    await waitFor(() => {
      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({active: true, currentWindow: true});
      expect(mockBrowser.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'FILL_OTP',
        code: '641481',
      });
    });
    expect(screen.getByRole('button', {name: /filled!/i})).toBeInTheDocument();
  });

  test('shows error when email has no content', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: undefined,
    };

    render(<FillOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /fill/i}));

    expect(screen.getByRole('button', {name: /empty email/i})).toBeInTheDocument();
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

    render(<FillOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /fill/i}));

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /otp input not found/i})).toBeInTheDocument();
    });
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

    render(<FillOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /fill/i}));

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /open a website tab first/i})).toBeInTheDocument();
    });
  });
});
