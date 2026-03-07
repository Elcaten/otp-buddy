import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {OpenPreviewButton} from './open-preview-button';
import type {Email} from '../../types/email';

describe('OpenPreviewButton', () => {
  const mockOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = mockOpen;
  });

  test('renders Preview button', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: '<p>Hello</p>',
    };

    render(<OpenPreviewButton email={email} />);
    expect(screen.getByRole('button', {name: /preview/i})).toBeInTheDocument();
  });

  test('opens sanitized HTML in new window when clicked', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: '<p>Hello <script>evil()</script></p>',
    };

    render(<OpenPreviewButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /preview/i}));

    expect(mockOpen).toHaveBeenCalledWith(expect.any(String), '_blank');
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  test('does nothing when content is empty', () => {
    const email: Email = {
      id: '1',
      subject: 'x',
      from: [],
      content: undefined,
    };

    render(<OpenPreviewButton email={email} />);
    fireEvent.click(screen.getByRole('button', {name: /preview/i}));

    expect(mockOpen).not.toHaveBeenCalled();
  });
});
