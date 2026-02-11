import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function MetaOAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing Facebook connection...');

  useEffect(() => {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');



    if (error) {
      setStatus('error');
      setMessage(errorDescription || error);

      // Send error back to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'META_OAUTH_CALLBACK',
            error: errorDescription || error,
          },
          '*'
        );
        // Delay close to ensure message is sent
        setTimeout(() => window.close(), 1000);
      }
      return;
    }

    if (code) {
      // CRITICAL: Always store in localStorage as backup
      // This ensures the parent window can retrieve the code even if postMessage fails
      try {
        localStorage.setItem('meta_oauth_code', code);
        localStorage.setItem('meta_oauth_timestamp', Date.now().toString());
      } catch (e) {
        console.error('MetaOAuthCallback: Failed to store in localStorage', e);
      }

      // Send code back to parent window via postMessage
      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: 'META_OAUTH_CALLBACK',
              code,
            },
            '*'
          );
          setStatus('success');
          setMessage('Connected! This window will close automatically.');
        } catch (e) {
          console.error('MetaOAuthCallback: postMessage failed', e);
        }

        // Delay close to ensure message is sent and localStorage is read
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        // No opener - user may have navigated here directly or opener was lost
        setStatus('success');
        setMessage('Authorization complete! You can close this window and return to the app.');
      }
    } else {
      setStatus('error');
      setMessage('No authorization code received. Please try again.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-6">
        {status === 'processing' && (
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        )}
        {status === 'success' && (
          <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
        )}
        {status === 'error' && (
          <XCircle className="h-8 w-8 mx-auto text-destructive" />
        )}
        <p className="text-muted-foreground">{message}</p>
        {status !== 'processing' && (
          <p className="text-xs text-muted-foreground">
            {status === 'success'
              ? 'This window will close automatically.'
              : 'You can close this window and try again.'}
          </p>
        )}
      </div>
    </div>
  );
}
