import {useEffect, useState} from 'react';
import type {FC} from 'react';
import {getStorage, setStorage} from '../utils/storage';
import {PROVIDERS} from '../types/providers';

const Options: FC = () => {
  const [fastmailApiKey, setFastmailApiKey] = useState('');
  const [provider, setProvider] = useState('fastmail');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStorage(['fastmailApiKey', 'provider']).then((result) => {
      setFastmailApiKey(result.fastmailApiKey);
      setProvider(result.provider);
    });
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await setStorage({fastmailApiKey, provider});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <header>
        <h1>Extension Settings</h1>
        <p>Configure your extension preferences</p>
      </header>

      <main>
        <form onSubmit={handleSave}>
          <fieldset>
            <legend>Provider</legend>
            {Object.values(PROVIDERS).map((providerOption) => (
              <div key={providerOption.id}>
                <label htmlFor={`provider-${providerOption.id}`}>
                  <input
                    type="radio"
                    id={`provider-${providerOption.id}`}
                    name="provider"
                    value={providerOption.id}
                    checked={provider === providerOption.id}
                    onChange={(e): void => setProvider(e.target.value)}
                  />
                  {providerOption.name}
                </label>
              </div>
            ))}
          </fieldset>

          <fieldset>
            <legend>Fastmail</legend>
            <div>
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
            </div>
          </fieldset>

          <button type="submit">Save Settings</button>
          {saved && <span>Settings saved</span>}
        </form>
      </main>
    </div>
  );
};

export default Options;
