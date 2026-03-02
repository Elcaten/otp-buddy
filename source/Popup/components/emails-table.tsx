import type {FC} from 'react';
import {Email} from '../../types/email';
import {CopyOTPButton} from './copy-opt-button';
import {OpenPreviewButton} from './open-preview-button';

export const EmailsTable: FC<{emails: Email[]}> = ({emails}) => (
  <table
    style={{
      tableLayout: 'auto',
      minWidth: 'fit-content',
      whiteSpace: 'nowrap',
    }}
  >
    <thead>
      <tr>
        <th>Subject</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {emails?.map((email) => (
        <tr key={email.id}>
          <td
            style={{
              verticalAlign: 'middle',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '400px',
            }}
          >
            {email.subject}
          </td>
          <td>
            <CopyOTPButton email={email} />
            <OpenPreviewButton email={email} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
