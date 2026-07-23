import {Button} from '@/components/ui/button';
import type {FC} from 'react';
import {Email} from '../../types/email';
import {useCopyOTPToClipboard} from './copy-opt-button';
import styles from './emails-table.module.css';
import {useFillOtp} from './fill-otp-button';
import {OpenPreviewButton} from './open-preview-button';

export const EmailsTable: FC<{emails: Email[]}> = ({emails}) => (
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {emails?.map((email) => (
        <TableRow key={email.id} email={email} />
      ))}
    </tbody>
  </table>
);

function TableRow({email}: {email: Email}) {
  const copyOtp = useCopyOTPToClipboard();
  const fillOtp = useFillOtp();

  const isError = copyOtp.state === 'error' || fillOtp.state === 'error';
  const primaryCellText = isError ? (copyOtp.stateDescription ?? fillOtp.stateDescription) : email.subject;

  return (
    <tr key={email.id} data-error={isError}>
      <td className={styles.subjectCell}>{primaryCellText}</td>
      <td className={styles.actionsCell}>
        <Button onClick={() => copyOtp.trigger(email)}>Copy</Button>
        <Button onClick={() => fillOtp.trigger(email)}>Fill</Button>
        <OpenPreviewButton email={email} />
      </td>
    </tr>
  );
}
