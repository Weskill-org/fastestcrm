import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MetaOAuthCallback() {
  useEffect(() => {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      // Send error back to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'META_OAUTH_CALLBACK',
            error: errorDescription || error,
          },
          '*'
        );
        window.close();
      }
      return;
    }

    if (code) {
      // Send code back to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'META_OAUTH_CALLBACK',
            code,
          },
          '*'
        );
        window.close();
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing Facebook connection...</p>
        <p className="text-xs text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
}
