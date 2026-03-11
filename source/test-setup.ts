import '@testing-library/jest-dom/vitest';
import {vi} from 'vitest';
import {mockBrowser} from './__mocks__/webextension-polyfill';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});
