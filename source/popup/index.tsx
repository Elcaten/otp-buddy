import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {initSentry} from '../utils/sentry';

import Popup from './popup';

initSentry();

const container = document.getElementById('popup-root');

if (!container) {
  throw new Error('Could not find root container to mount the app');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
