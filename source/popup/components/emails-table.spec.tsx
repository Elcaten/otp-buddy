import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {EmailsTable} from './emails-table';
import type {Email} from '../../types/email';

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {writeText: vi.fn().mockResolvedValue(undefined)},
  });
  vi.spyOn(window, 'open').mockReturnValue(null);
});

describe('EmailsTable', () => {
  const emails: Email[] = [
    {
      id: '1',
      subject: 'Your verification code',
      from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
      content: '<p>body one</p>',
    },
    {
      id: '2',
      subject: 'Sign in to GitLab',
      from: [{email: 'no-reply@gitlab.com'}],
      content: '<p>body two</p>',
    },
  ];

  test('renders one table row per email', () => {
    render(<EmailsTable emails={emails} />);

    const rows = screen.getAllByRole('row');
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  test('renders email subject in each row', () => {
    render(<EmailsTable emails={emails} />);

    expect(screen.getByText('Your verification code')).toBeInTheDocument();
    expect(screen.getByText('Sign in to GitLab')).toBeInTheDocument();
  });

  test('renders a CopyOTPButton for each email', () => {
    render(<EmailsTable emails={emails} />);

    const copyButtons = screen.getAllByRole('button', {name: /copy/i});
    expect(copyButtons).toHaveLength(2);
  });

  test('renders a Preview button for each email', () => {
    render(<EmailsTable emails={emails} />);

    const previewButtons = screen.getAllByRole('button', {name: /preview/i});
    expect(previewButtons).toHaveLength(2);
  });

  test('renders header columns', () => {
    render(<EmailsTable emails={emails} />);

    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('renders empty table body when emails is empty', () => {
    render(<EmailsTable emails={[]} />);

    const rows = screen.getAllByRole('row');
    // Only header row
    expect(rows).toHaveLength(1);
  });
});
