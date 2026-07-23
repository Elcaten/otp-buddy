import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {mockBrowser} from '../../__mocks__/webextension-polyfill';
import type {Email} from '../../types/email';
import {EmailsTable} from './emails-table';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: {writeText: vi.fn().mockResolvedValue(undefined)},
  });
  vi.mocked(mockBrowser.tabs.query).mockResolvedValue([{id: 123}] as never);
  vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({success: true} as never);
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

  test('renders a Copy action for each email', () => {
    render(<EmailsTable emails={emails} />);

    const copyButtons = screen.getAllByRole('button', {name: /copy/i});
    expect(copyButtons).toHaveLength(2);
  });

  test('renders a Fill action for each email', () => {
    render(<EmailsTable emails={emails} />);

    const fillButtons = screen.getAllByRole('button', {name: /fill/i});
    expect(fillButtons).toHaveLength(2);
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

  test('shows a copy error in only the affected row', () => {
    const emailsWithEmptyContent: Email[] = [
      {...emails[0]!, content: undefined},
      emails[1]!,
    ];
    render(<EmailsTable emails={emailsWithEmptyContent} />);

    fireEvent.click(screen.getAllByRole('button', {name: 'Copy'})[0]!);

    const errorCell = screen.getByText('Empty email');
    const errorRow = errorCell.closest('tr');
    expect(errorRow).toHaveAttribute('data-error', 'true');
    expect(within(errorRow!).getByRole('button', {name: 'Copy'})).toBeInTheDocument();
    expect(screen.queryByText('Your verification code')).not.toBeInTheDocument();
    expect(screen.getByText('Sign in to GitLab')).toBeInTheDocument();
  });

  test('shows a fill error in the affected row', async () => {
    vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({
      success: false,
      error: 'OTP input not found',
    } as never);
    render(
      <EmailsTable
        emails={[
          {
            ...emails[0]!,
            subject: '641481 is your Polymarket login code',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', {name: 'Fill'}));

    await waitFor(() => {
      expect(screen.getByText('OTP input not found')).toBeInTheDocument();
    });
    expect(screen.getByText('OTP input not found').closest('tr')).toHaveAttribute('data-error', 'true');
    expect(screen.getByRole('button', {name: 'Fill'})).toBeInTheDocument();
  });
});
