import {useCallback, useEffect, useState} from 'react';
import browser from 'webextension-polyfill';
import {EmailParser} from '../../email-parser/email-parser';
import type {Email} from '../../types/email';
import {type FillOtpResponse} from '../../types/messages';

export function useFillOtp(emailParser: EmailParser) {
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [stateDescription, setStateDescription] = useState<string | undefined>();

  const trigger = useCallback(
    async (email: Email) => {
      const emailContent = email.content;
      if (!emailContent) {
        setState('error');
        setStateDescription('Empty email');
        return;
      }

      if (!emailParser.canParse(email)) {
        setState('error');
        setStateDescription('Parser not found');
        return;
      }

      const result = emailParser.tryParse(email);
      if (!result.success) {
        setState('error');
        setStateDescription('Parser error');
        return;
      }

      try {
        const [activeTab] = await browser.tabs.query({active: true, currentWindow: true});
        if (activeTab?.id == null) {
          setState('error');
          setStateDescription('Active tab not found');
          return;
        }

        const response = (await browser.tabs.sendMessage(activeTab.id, {
          type: 'FILL_OTP',
          code: result.result,
        })) as FillOtpResponse | undefined;

        if (!response?.success) {
          setState('error');
          setStateDescription(response?.error ?? 'Fill failed');
          return;
        }

        setState('success');
        setStateDescription(undefined);
      } catch (error) {
        setState('error');
        setStateDescription(getFillErrorDescription(error));
      }
    },
    [emailParser]
  );

  useEffect(() => {
    let timeout: number;
    if (state === 'success') {
      timeout = window.setTimeout(() => setState('pending'), 4000);
    }
    if (state === 'error') {
      timeout = window.setTimeout(() => setState('pending'), 4000);
    }
    return (): void => {
      timeout && clearTimeout(timeout);
    };
  }, [state]);

  return {trigger, state, stateDescription};
}

function getFillErrorDescription(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Could not establish connection') || message.includes('Receiving end does not exist')) {
    return 'Open a website tab first';
  }

  return 'Fill failed';
}
