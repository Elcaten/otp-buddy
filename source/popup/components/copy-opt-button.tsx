import {JSX, useCallback, useEffect, useState} from 'react';
import {Email} from '../../types/email';
import {EmailParser} from '../../email-parser/email-parser';
import {Button} from '../../components/ui/button';
import {emailParserConfig} from '@/email-parser/email-parser-config';

const emailParser = new EmailParser(emailParserConfig);

function useCopyOTPToClipboard() {
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
      setStateDescription('Parser error');
      return;
    }

    setState('success');

    await navigator.clipboard.writeText(result.result);
  }, []);

  useEffect(() => {
    let timeout: number;
    if (state === 'success') {
      timeout = window.setTimeout(() => setState('pending'), 3000);
    }
    return (): void => {
      timeout && clearTimeout(timeout);
    };
  }, [state]);

  return {trigger, state, stateDescription};
}

export function CopyOTPButton({email}: {email: Email}): JSX.Element {
  const {trigger, state, stateDescription} = useCopyOTPToClipboard();

  return (
    <Button style={{minWidth: '140px'}} onClick={() => trigger(email)}>
      {state === 'pending' && 'Copy'}
      {state === 'success' && 'Copied!'}
      {state === 'error' && stateDescription}
    </Button>
  );
}
