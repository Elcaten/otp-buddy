import {JSX} from 'react';
import {Email} from '../../types/email';
import DOMPurify from 'dompurify';
import {EyeIcon} from 'lucide-react';
import {Button} from '../../components/ui/button';

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
    <Button size="icon" onClick={handlePreviewClick} aria-label="Preview">
      <EyeIcon size={14} />
    </Button>
  );
}
