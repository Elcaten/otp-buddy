import type {FC} from 'react';
import {useEffect, useState} from 'react';
import {PROVIDERS} from '../types/providers';
import {getStorage, setStorage} from '../utils/storage';
import {JamClient} from 'jmap-jam';
import {useQuery} from '../Popup/useQuery';
import {GmailOptions} from './GmailOptions';
import {useDebounceState} from '../utils/use-debounce-state';

const Options: FC = () => {
  const [provider, setProvider] = useState<'fastmail' | 'gmail' | 'imap'>(
    'fastmail'
  );
  const [saved, setSaved] = useState(false);

  const [fastmailApiKey, setFastmailApiKey] = useDebounceState('', {
    delay: 300,
    leading: true,
    trailing: true,
  });
  const [fastmailAccountId, setFastmailAccountId] = useState('');
  const accountQuery = useQuery({
    queryKey: 'fastmailAccounts' + fastmailApiKey.debounced,
    enabled: !!fastmailApiKey.debounced,
    queryFn: async () => {
      const client = new JamClient({
        bearerToken: fastmailApiKey.debounced,
        sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
      });
      const session = await client.session;
      return Object.entries(session.accounts).map(([id, account]) => {
        return {id, name: account.name};
      });
    },
  });

  useEffect(() => {
    getStorage(['fastmailApiKey', 'fastmailAccountId', 'provider']).then(
      (result) => {
        setFastmailApiKey(result.fastmailApiKey);
        setFastmailAccountId(result.fastmailAccountId);
        setProvider(result.provider);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await setStorage({
      fastmailApiKey: fastmailApiKey.debounced,
      fastmailAccountId,
      provider,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <form onSubmit={handleSave}>
        <h1>Email Provider settings</h1>

        <fieldset>
          {Object.values(PROVIDERS).map((providerOption) => (
            <div key={providerOption.id}>
              <input
                type="radio"
                name="provider"
                id={providerOption.id}
                value={providerOption.id}
                checked={provider === providerOption.id}
                onChange={(e): void =>
                  setProvider(e.target.value as 'fastmail' | 'gmail' | 'imap')
                }
              />
              <label htmlFor={providerOption.id}>{providerOption.name}</label>
            </div>
          ))}
        </fieldset>

        {provider === 'gmail' && <GmailOptions />}

        {provider === 'fastmail' && (
          <fieldset>
            <label htmlFor="fastmailApiKey">Fastmail API key</label>
            <div
              style={{
                fontSize: '0.85em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              You can generate API key in{' '}
              <a
                href="https://app.fastmail.com/settings/security/tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fastmail settings
              </a>
              . Unfortunatelly, API keys are not available for Basic accounts.
            </div>
            <input
              type="password"
              id="fastmailApiKey"
              name="fastmailApiKey"
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              spellCheck={false}
              autoComplete="off"
              value={fastmailApiKey.value}
              onChange={(e): void => setFastmailApiKey(e.target.value)}
            />
            {Boolean(accountQuery.loading) && <div>⏳</div>}
            {Boolean(accountQuery.error) && (
              <div style={{color: 'var(--highlight)'}}>
                Can&apos;t connect to Fastmail. Please check your API key.
              </div>
            )}
            {!Boolean(accountQuery.loading) && !Boolean(accountQuery.error) && (
              <div>&nbsp;</div>
            )}

            <label htmlFor="accountId">Account</label>
            <select
              id="accountId"
              name="accountId"
              disabled={accountQuery.loading || !accountQuery.data}
              value={fastmailAccountId}
              onChange={(e): void => setFastmailAccountId(e.target.value)}
            >
              <option value="">--- Select an account ---</option>
              {accountQuery.data?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </fieldset>
        )}

        <button type="submit">Save Settings</button>
        {saved && (
          <span style={{color: 'var(--highlight)', marginLeft: '8px'}}>
            Settings saved!
          </span>
        )}
      </form>
    </main>
  );
};

export default Options;
