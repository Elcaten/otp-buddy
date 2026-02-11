import type {FC} from 'react';
import {useEffect, useState} from 'react';
import {PROVIDERS} from '../types/providers';
import {getStorage, setStorage} from '../utils/storage';
import {log} from '../utils/logger';
import {JamClient} from 'jmap-jam';
import {useQuery} from '../Popup/useQuery';
import {GmailOptions} from './GmailOptions';

const Options: FC = () => {
  const [provider, setProvider] = useState<'fastmail' | 'gmail' | 'imap'>(
    'fastmail'
  );
  const [saved, setSaved] = useState(false);

  const [fastmailApiKey, setFastmailApiKey] = useState('');
  const [fastmailAccountId, setFastmailAccountId] = useState('');
  const accountQuery = useQuery({
    enabled: !!fastmailApiKey,
    queryFn: async () => {
      const client = new JamClient({
        bearerToken: fastmailApiKey,
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
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await setStorage({fastmailApiKey, fastmailAccountId, provider});
    debugger;
    log.options.info('Settings saved');
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
              {/* <Description>
                    Customers can resell or transfer their tickets if they can’t
                    make it to the event.
                  </Description> */}
            </div>
          ))}
        </fieldset>

        {provider === 'gmail' && <GmailOptions />}

        {provider === 'fastmail' && (
          <fieldset>
            <label htmlFor="fastmailApiKey">Fastmail API key</label>
            <input
              type="password"
              id="fastmailApiKey"
              name="fastmailApiKey"
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              spellCheck={false}
              autoComplete="off"
              value={fastmailApiKey}
              onChange={(e): void => setFastmailApiKey(e.target.value)}
            />

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
          <span className="mx-2 text-sm text-amber-500 dark:text-amber-600">
            Settings saved!
          </span>
        )}
      </form>
    </main>
  );
};

export default Options;
