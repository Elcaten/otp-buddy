import {JSX} from 'react';
import {Email} from '../../email/types';
import DOMPurify from 'dompurify';

export function OpenPreviewButton({email}: {email: Email}): JSX.Element {
  const handlePreviewClick = async (): Promise<void> => {
    const mainHtmlPart = email.content;
    if (!mainHtmlPart) {
      return;
    }

    const newWindow = window.open('', '_blank');

    if (!newWindow) {
      return;
    }

    const policy = window.trustedTypes!.createPolicy('default', {
      createHTML: (to_escape) =>
        DOMPurify.sanitize(to_escape, {RETURN_TRUSTED_TYPE: false}),
    });

    if (!policy) {
      return;
    }

    newWindow.document.open();
    newWindow.document.write(
      policy.createHTML(mainHtmlPart) as unknown as string
    );
    newWindow.document.close();
  };

  return (
    <button type="button" onClick={handlePreviewClick}>
      Preview
    </button>
  );
}
