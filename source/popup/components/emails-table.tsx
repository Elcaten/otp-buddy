import {Button} from '@/components/ui/button';
import {EmailParser} from '@/email-parser/email-parser';
import type {FC, PropsWithChildren, ReactNode} from 'react';
import {Email} from '../../types/email';
import {useCopyOTPToClipboard} from './copy-opt-button';
import styles from './emails-table.module.css';
import {useFillOtp} from './fill-otp-button';
import {OpenPreviewButton} from './open-preview-button';

export const EmailsTable: FC<{emails: Email[]; emailParser: EmailParser}> = ({emails, emailParser}) => (
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {emails?.map((email) => (
        <TableRow key={email.id} email={email} emailParser={emailParser} />
      ))}
    </tbody>
  </table>
);

function TableRow({email, emailParser}: {email: Email; emailParser: EmailParser}) {
  const copyOtp = useCopyOTPToClipboard(emailParser);
  const fillOtp = useFillOtp(emailParser);

  return (
    <tr key={email.id}>
      <td className={styles.subjectCell}>
        <Text
          state={copyOtp.state}
          pendingText={email.subject ?? 'No subject'}
          errorText={
            (copyOtp.state === 'error'
              ? copyOtp.stateDescription
              : fillOtp.state === 'error'
                ? fillOtp.stateDescription
                : undefined) ?? 'Unknown error'
          }
          successText={copyOtp.stateDescription}
        />
      </td>
      <td className={styles.actionsCell}>
        <Button onClick={() => copyOtp.trigger(email)}>COPY</Button>
        <Button onClick={() => fillOtp.trigger(email)}>FILL</Button>
        <OpenPreviewButton email={email} />
      </td>
    </tr>
  );
}

function Text({
  state,
  pendingText,
  errorText,
  successText,
}: PropsWithChildren<{
  state: 'pending' | 'success' | 'error';
  pendingText: string;
  errorText: string;
  successText: ReactNode;
}>) {
  return (
    <div className={styles.text} data-state={state}>
      <span className={styles.textPending}>{pendingText}</span>
      <strong className={styles.textSuccess}>🎉 {successText}</strong>
      <strong className={styles.textError}>❌ {errorText}</strong>
    </div>
  );
}
