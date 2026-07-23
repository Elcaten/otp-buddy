import {ReactNode, useMemo} from 'react';
import useSWR, {mutate} from 'swr';
import {loadEmailParserConfig} from '../../email-parser/email-parser-config';
import {EmailParser} from '../../email-parser/email-parser';

export const EMAIL_PARSER_CONFIG_QUERY_KEY = 'emailParserConfig';

export function EmailParserConfigGate({children}: {children: (emailParser: EmailParser) => ReactNode}) {
  const configQuery = useSWR(EMAIL_PARSER_CONFIG_QUERY_KEY, loadEmailParserConfig, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const emailParser = useMemo(() => new EmailParser(configQuery.data), [configQuery.data]);

  return children(emailParser);
}

export async function resetEmailParserConfigQuery(): Promise<void> {
  await mutate(EMAIL_PARSER_CONFIG_QUERY_KEY, undefined, {revalidate: false});
}
