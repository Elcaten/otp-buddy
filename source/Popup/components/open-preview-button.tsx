import {JSX} from 'react';
import {Email} from '../../types/email';
import DOMPurify from 'dompurify';

export function OpenPreviewButton({email}: {email: Email}): JSX.Element {
  const handlePreviewClick = async (): Promise<void> => {
    const mainHtmlPart = email.content;
    if (!mainHtmlPart) {
      return;
    }

    // Sanitize the HTML
    const sanitizedHtml = DOMPurify.sanitize(mainHtmlPart, {
      RETURN_TRUSTED_TYPE: false,
    });

    // Create a Blob from the HTML content
    const blob = new Blob([sanitizedHtml], {type: 'text/html'});
    const blobUrl = URL.createObjectURL(blob);

    // Open the blob URL in a new window
    const newWindow = window.open(blobUrl, '_blank');

    // Optional: Revoke the URL after a delay to free up memory
    if (newWindow) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    }
  };

  return (
    <button type="button" onClick={handlePreviewClick}>
      Preview
    </button>
  );
}
