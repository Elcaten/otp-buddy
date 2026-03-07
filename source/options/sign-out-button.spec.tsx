import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';

import {SignOutButton} from './sign-out-button';

const mockTrigger = vi.hoisted(() => vi.fn());

vi.mock('../queries/use-gmail-auth', () => {return {
  useSignIn: vi.fn().mockReturnValue({trigger: vi.fn(), isMutating: false}),
  useSignOut: vi.fn().mockReturnValue({trigger: mockTrigger, isMutating: false}),
}});

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Sign Out text', () => {
    render(<SignOutButton />);
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  test('renders a button element', () => {
    render(<SignOutButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls useSignOut trigger when clicked', () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockTrigger).toHaveBeenCalledOnce();
  });
});
