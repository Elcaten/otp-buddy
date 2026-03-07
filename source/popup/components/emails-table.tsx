import type {FC} from 'react';
import {Email} from '../../types/email';
import {CopyOTPButton} from './copy-opt-button';
import {OpenPreviewButton} from './open-preview-button';
import styles from './emails-table.module.css';

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
        <tr key={email.id}>
          <td className={styles.subjectCell}>{email.subject}</td>
          <td className={styles.actionsCell}>
            <CopyOTPButton email={email} />
            <OpenPreviewButton email={email} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
