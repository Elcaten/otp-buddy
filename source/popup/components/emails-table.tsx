import {Button} from '@/components/ui/button';
import {EmailParser} from '@/email-parser/email-parser';
import type {FC} from 'react';
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

  const isError = copyOtp.state === 'error' || fillOtp.state === 'error';
  const primaryCellText = isError ? (copyOtp.stateDescription ?? fillOtp.stateDescription) : email.subject;

  const copyButtonText = copyOtp.state === 'success' ? 'Copied 🎉' : 'Copy';
  const fillButtonText = fillOtp.state === 'success' ? 'Filled 🎉' : 'Fill';

  return (
    <tr key={email.id} data-error={isError}>
      <td className={styles.subjectCell}>{primaryCellText}</td>
      <td className={styles.actionsCell}>
        <Button onClick={() => copyOtp.trigger(email)} style={{minWidth: '120px'}}>
          {copyButtonText}
        </Button>
        <Button onClick={() => fillOtp.trigger(email)} style={{minWidth: '120px'}}>
          {fillButtonText}
        </Button>
        <OpenPreviewButton email={email} />
      </td>
    </tr>
  );
}
