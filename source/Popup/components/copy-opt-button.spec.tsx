import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {CopyOTPButton} from './copy-opt-button';
import type {Email} from '../../types/email';

describe('CopyOTPButton', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {writeText: mockWriteText.mockResolvedValue(undefined)},
    });
  });

  test('renders Copy OTP when pending', () => {
    const email: Email = {
      id: '1',
      subject: '123456 is your code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<html>641481</html>',
    };

    render(<CopyOTPButton email={email} />);
    expect(screen.getByRole('button', {name: /copy otp/i})).toBeInTheDocument();
  });

  test('copies OTP to clipboard and shows Copied! on success', async () => {
    const email: Email = {
      id: '1',
      subject: '641481 is your Polymarket login code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body</p>',
    };

    render(<CopyOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /copy otp/i}));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('641481');
    });
    expect(screen.getByRole('button', {name: /copied!/i})).toBeInTheDocument();
  });

  test('shows error when email has no content', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: undefined,
    };

    render(<CopyOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /copy otp/i}));

    expect(
      screen.getByRole('button', {name: /empty email/i})
    ).toBeInTheDocument();
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  test('shows error when no parser matches', () => {
    const email: Email = {
      id: '1',
      subject: 'Hello',
      from: [{email: 'user@gmail.com'}],
      content: '<p>No OTP here</p>',
    };

    render(<CopyOTPButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /copy otp/i}));

    expect(
      screen.getByRole('button', {name: /parser not found/i})
    ).toBeInTheDocument();
    expect(mockWriteText).not.toHaveBeenCalled();
  });
});
