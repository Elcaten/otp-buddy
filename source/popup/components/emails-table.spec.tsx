import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {mockBrowser} from '../../__mocks__/webextension-polyfill';
import emailParserConfigJson from '../../email-parser/email-parser-config.json';
import type {EmailParserConfig} from '../../email-parser/email-parser-config';
import {EmailParser} from '../../email-parser/email-parser';
import type {Email} from '../../types/email';
import {EmailsTable} from './emails-table';

const emailParser = new EmailParser(emailParserConfigJson as EmailParserConfig);

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
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    const rows = screen.getAllByRole('row');
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  test('renders email subject in each row', () => {
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    expect(screen.getByText('Your verification code')).toBeInTheDocument();
    expect(screen.getByText('Sign in to GitLab')).toBeInTheDocument();
  });

  test('renders a Copy action for each email', () => {
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    const copyButtons = screen.getAllByRole('button', {name: /copy/i});
    expect(copyButtons).toHaveLength(2);
  });

  test('renders a Fill action for each email', () => {
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    const fillButtons = screen.getAllByRole('button', {name: /fill/i});
    expect(fillButtons).toHaveLength(2);
  });

  test('renders a Preview button for each email', () => {
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    const previewButtons = screen.getAllByRole('button', {name: /preview/i});
    expect(previewButtons).toHaveLength(2);
  });

  test('renders header columns', () => {
    render(<EmailsTable emails={emails} emailParser={emailParser} />);

    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('renders empty table body when emails is empty', () => {
    render(<EmailsTable emails={[]} emailParser={emailParser} />);

    const rows = screen.getAllByRole('row');
    // Only header row
    expect(rows).toHaveLength(1);
  });

  test('shows a copy error in only the affected row', () => {
    const emailsWithEmptyContent: Email[] = [
      {...emails[0]!, content: undefined},
      emails[1]!,
    ];
    render(<EmailsTable emails={emailsWithEmptyContent} emailParser={emailParser} />);

    const copyButton = screen.getAllByRole('button', {name: 'COPY'})[0]!;
    const errorRow = copyButton.closest('tr')!;
    fireEvent.click(copyButton);

    const errorText = errorRow.querySelector('[data-state]');
    expect(errorText).toHaveAttribute('data-state', 'error');
    expect(errorText).toHaveTextContent('Empty email');
    expect(within(errorRow).getByRole('button', {name: 'COPY'})).toBeInTheDocument();
    expect(screen.getByText('Sign in to GitLab').closest('[data-state]')).toHaveAttribute('data-state', 'pending');
  });

  test('shows a fill error in the affected row', async () => {
    vi.mocked(mockBrowser.tabs.sendMessage).mockResolvedValue({
      success: false,
      error: 'OTP input not found',
    } as never);
    render(
      <EmailsTable
        emailParser={emailParser}
        emails={[
          {
            ...emails[0]!,
            subject: '641481 is your Polymarket login code',
          },
        ]}
      />
    );

    const fillButton = screen.getByRole('button', {name: 'FILL'});
    const errorRow = fillButton.closest('tr')!;
    fireEvent.click(fillButton);

    await waitFor(() => {
      expect(errorRow).toHaveTextContent('OTP input not found');
    });
    expect(within(errorRow).getByRole('button', {name: 'FILL'})).toBeInTheDocument();
  });
});
