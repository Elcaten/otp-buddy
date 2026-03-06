import {JamClient} from 'jmap-jam';
import {PropsWithChildren, ReactNode, SubmitEventHandler, Suspense, useRef, useState} from 'react';
import {ErrorBoundary, FallbackProps as ErrorBoundaryFallbackProps} from 'react-error-boundary';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {Button} from '../components/ui/button';
import {PROVIDERS} from '../types/providers';
import {getAllStorage, setStorage} from '../utils/storage';
import {useDebounceState} from '../utils/use-debounce-state';
import {GmailOptions} from './gmail-options';
import styles from './options.module.css';
import clsx from 'clsx';

//#region Options layout

const OptionsLayout = Object.assign(
  function ({children}: PropsWithChildren) {
    return <main className="mx-auto max-w-md p-4">{children}</main>;
  },
  {
    Content: function Content({children}: PropsWithChildren) {
      return <>{children}</>;
    },
    Form: function Form({children, onSubmit}: PropsWithChildren<{onSubmit?: React.FormEventHandler}>) {
      return (
        <form onSubmit={onSubmit}>
          <h1>Email Provider settings</h1>
          {children}
        </form>
      );
    },
  }
);

//#endregion

//#region Form fields

type ProverSelectorProps = {
  value: 'fastmail' | 'gmail';
  onChange?: (value: 'fastmail' | 'gmail') => void;
};
function ProviderSelector({value, onChange}: ProverSelectorProps) {
  return (
    <>
      {Object.values(PROVIDERS).map((providerOption) => (
        <div key={providerOption.id}>
          <input
            type="radio"
            name="provider"
            id={providerOption.id}
            value={providerOption.id}
            checked={value === providerOption.id}
            onChange={(e): void => onChange?.(e.target.value as 'fastmail' | 'gmail')}
          />
          <label htmlFor={providerOption.id}>{providerOption.name}</label>
        </div>
      ))}
    </>
  );
}

type FastmailApiKeyInputProps = {
  errorMessage?: ReactNode;
  value: string;
  onChange: (value: string) => void;
};
function FastmailApiKeyInput({errorMessage, value, onChange}: FastmailApiKeyInputProps) {
  return (
    <>
      <label htmlFor="fastmailApiKey">Fastmail API key</label>
      <div
        style={{
          fontSize: '0.85em',
          color: 'var(--text-muted)',
          marginBottom: '4px',
        }}
      >
        You can generate API key in{' '}
        <a href="https://app.fastmail.com/settings/security/tokens" target="_blank" rel="noopener noreferrer">
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
        value={value}
        onChange={(e): void => onChange(e.target.value)}
      />
      {errorMessage && <div style={{color: 'var(--highlight)'}}>{errorMessage}</div>}
      {!errorMessage && <div>&nbsp;</div>}
    </>
  );
}

type FastmailAccountsSelectorProps = {
  isValidating: boolean;
  options: {id: string; name: string}[];
  value: string;
  onChange: (value: string) => void;
};
function FastmailAccountsSelector({isValidating, options, value, onChange}: FastmailAccountsSelectorProps) {
  return (
    <>
      <label htmlFor="accountId">
        Account
        {isValidating && <span aria-hidden>&nbsp;⏳</span>}
      </label>
      <select
        id="accountId"
        name="accountId"
        disabled={isValidating}
        value={value}
        onChange={(e): void => onChange(e.target.value)}
      >
        <option value="">--- Select an account ---</option>
        {options.map((account: {id: string; name: string}) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </>
  );
}
//#endregion

//#region Options states

const OptionsState = {
  Loading: () => (
    <OptionsLayout>
      <OptionsLayout.Content>
        <OptionsLayout.Form>
          <fieldset disabled>
            <ProviderSelector value={'fastmail'} />
          </fieldset>
        </OptionsLayout.Form>
      </OptionsLayout.Content>
    </OptionsLayout>
  ),
  Error: (_props: ErrorBoundaryFallbackProps) => (
    <OptionsLayout>
      <OptionsLayout.Content>
        <p>Something went wrong</p>
      </OptionsLayout.Content>
    </OptionsLayout>
  ),
};

//#endregion

//#region Container components

function OptionsFormContainer(props: {
  initialProvider: 'fastmail' | 'gmail';
  initialFastmailApiKey: string;
  initialFastmailAccountId: string;
}) {
  const [provider, setProvider] = useState(props.initialProvider);
  const [fastmailApiKey, setFastmailApiKey] = useDebounceState(props.initialFastmailApiKey, {
    delay: 300,
    leading: true,
    trailing: true,
  });
  const [fastmailAccountId, setFastmailAccountId] = useState(props.initialFastmailAccountId);

  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accountQuery = useSWR(
    !!fastmailApiKey.debounced ? 'fastmailAccounts' + fastmailApiKey.debounced : null,
    async () => {
      const client = new JamClient({
        bearerToken: fastmailApiKey.debounced,
        sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
      });
      const session = await client.session;
      return Object.entries(session.accounts).map(([id, account]) => {
        return {id, name: account.name};
      });
    }
  );

  const handleFastmailApiKeyChange = (value: string) => {
    setFastmailApiKey(value);
  };

  const handleFastmailAccountIdChange = (value: string) => {
    setFastmailAccountId(value);
  };

  const onSubmit = useSWRMutation('storage', async () => {
    if (accountQuery.error) {
      return;
    }

    savedTimeout.current && clearTimeout(savedTimeout.current);

    await setStorage({
      provider: provider,
      fastmailApiKey: fastmailApiKey.value,
      fastmailAccountId: fastmailAccountId,
    });

    setSaved(true);
    savedTimeout.current = setTimeout(() => {
      setSaved(false);
    }, 2000);
  });

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (onSubmit.isMutating) {
      return;
    }

    onSubmit.trigger();
  };

  return (
    <OptionsLayout>
      <OptionsLayout.Content>
        <OptionsLayout.Form onSubmit={handleSubmit}>
          <fieldset>
            <ProviderSelector value={provider} onChange={setProvider} />
          </fieldset>

          {provider === 'gmail' && <GmailOptions />}

          {provider === 'fastmail' && (
            <fieldset>
              <FastmailApiKeyInput
                errorMessage={accountQuery.error ? `Can't connect to Fastmail. Please check your API key.` : undefined}
                value={fastmailApiKey.value}
                onChange={handleFastmailApiKeyChange}
              />

              <FastmailAccountsSelector
                value={fastmailAccountId}
                onChange={handleFastmailAccountIdChange}
                isValidating={accountQuery.isValidating}
                options={accountQuery.data ?? []}
              />
            </fieldset>
          )}

          <div className={styles.actions}>
            <Button type="submit">Save</Button>
            <span aria-hidden="true" className={clsx(styles.savedIcon, saved && styles.savedIconVisible)}>
              ✅
            </span>
          </div>
        </OptionsLayout.Form>
      </OptionsLayout.Content>
    </OptionsLayout>
  );
}

function OptionsContentContainer() {
  const storageQuery = useSWR('storage', () => getAllStorage(), {suspense: true});

  return (
    <OptionsFormContainer
      initialProvider={storageQuery.data.provider}
      initialFastmailApiKey={storageQuery.data.fastmailApiKey}
      initialFastmailAccountId={storageQuery.data.fastmailAccountId}
    />
  );
}

//#endregion

//#region Options itself

export default function Options() {
  return (
    <ErrorBoundary FallbackComponent={OptionsState.Error}>
      <Suspense fallback={<OptionsState.Loading />}>
        <OptionsContentContainer />
      </Suspense>
    </ErrorBoundary>
  );
}

//#endregion
