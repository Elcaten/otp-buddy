import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {SWRConfig, SWRConfiguration} from 'swr';
import {initSentry} from '../utils/sentry';

import Options from './options';

initSentry();

const container = document.getElementById('options-root');

if (!container) {
  throw new Error('Could not find root container to mount the app');
}

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
};

const root = createRoot(container);
root.render(
  <StrictMode>
    <SWRConfig value={swrConfig}>
      <Options />
    </SWRConfig>
  </StrictMode>
);
