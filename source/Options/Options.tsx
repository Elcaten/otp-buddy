import type {FC} from 'react';
import {useEffect, useState} from 'react';
import {Field, FieldGroup, Fieldset, Label} from '../components/fieldset';
import {Input} from '../components/input';
import {Radio, RadioField, RadioGroup} from '../components/radio';
import {PROVIDERS} from '../types/providers';
import {getStorage, setStorage} from '../utils/storage';
import {Button} from '../components/button';
import {Divider} from '../components/divider';
import {Select} from '../components/select';
import {JamClient} from 'jmap-jam';
import {useQuery} from '../Popup/useQuery';
import {Heading} from '../components/heading';
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <form onSubmit={handleSave}>
        <Heading level={1}>OPT settings</Heading>
        <Fieldset>
          <RadioGroup
            name="providers"
            defaultValue={'fastmail' as const}
            value={provider}
            onChange={(value) => setProvider(value)}
          >
            {Object.values(PROVIDERS).map((providerOption) => (
              <RadioField key={providerOption.id}>
                <Radio value={providerOption.id} />
                <Label>{providerOption.name}</Label>
                {/* <Description>
                    Customers can resell or transfer their tickets if they can’t
                    make it to the event.
                  </Description> */}
              </RadioField>
            ))}
          </RadioGroup>

          {provider === 'gmail' && <GmailOptions />}

          {provider === 'fastmail' && (
            <FieldGroup>
              <Field>
                <Label htmlFor="fastmailApiKey">Fastmail API key</Label>
                <Input
                  type="password"
                  id="fastmailApiKey"
                  name="fastmailApiKey"
                  placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                  spellCheck={false}
                  autoComplete="off"
                  value={fastmailApiKey}
                  onChange={(e): void => setFastmailApiKey(e.target.value)}
                />
              </Field>

              <Field>
                <Label>Account</Label>
                <Select
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
                </Select>
              </Field>
            </FieldGroup>
          )}

          <Divider className="my-8" />

          <Button type="submit">Save Settings</Button>
          {saved && (
            <span className="mx-2 text-sm text-amber-500 dark:text-amber-600">
              Settings saved!
            </span>
          )}
        </Fieldset>
      </form>
    </main>
  );
};

export default Options;
