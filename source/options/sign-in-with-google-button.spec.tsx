import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';

import {SignInWithGoogleButton} from './sign-in-with-google-button';

const mockTrigger = vi.hoisted(() => vi.fn());

vi.mock('../queries/use-gmail-auth', () => {return {
  useSignIn: vi.fn().mockReturnValue({trigger: mockTrigger, isMutating: false}),
  useSignOut: vi.fn().mockReturnValue({trigger: vi.fn(), isMutating: false}),
}});

describe('SignInWithGoogleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Sign In With Google text', () => {
    render(<SignInWithGoogleButton />);
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  test('renders a button element', () => {
    render(<SignInWithGoogleButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls useSignIn trigger when clicked', () => {
    render(<SignInWithGoogleButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockTrigger).toHaveBeenCalledOnce();
  });

  test('button is enabled by default', () => {
    render(<SignInWithGoogleButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  test('button is disabled when disabled prop is true', () => {
    render(<SignInWithGoogleButton disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('does not call trigger when disabled and clicked', () => {
    render(<SignInWithGoogleButton disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
