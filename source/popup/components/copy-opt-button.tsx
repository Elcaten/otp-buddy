import {useCallback, useEffect, useState} from 'react';
import {EmailParser} from '../../email-parser/email-parser';
import {Email} from '../../types/email';

export function useCopyOTPToClipboard(emailParser: EmailParser) {
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [stateDescription, setStateDescription] = useState<string | undefined>();

  const trigger = useCallback(async (email: Email) => {
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
      setStateDescription('Parser error: ' + result.error);
      return;
    }

    setState('success');

    await navigator.clipboard.writeText(result.result);
  }, [emailParser]);

  useEffect(() => {
    let timeout: number;
    if (state === 'success') {
      timeout = window.setTimeout(() => setState('pending'), 3000);
    }
    if (state === 'error') {
      timeout = window.setTimeout(() => setState('pending'), 3000);
    }
    return (): void => {
      timeout && clearTimeout(timeout);
    };
  }, [state]);

  return {trigger, state, stateDescription};
}
