/**
 * Detects if the application is being loaded within an Android WebView.
 * 
 * Android WebViews typically include "Version/X.X" and "Chrome/X.X" 
 * but more importantly, for standard WebViews, they often include "wv" 
 * or lack the "Safari" string while containing "Chrome" or "Android".
 * 
 * A common reliable check for Android WebView is:
 * 1. Contains "Android" 
 * 2. Contains "Chrome"
 * 3. Contains "Version/" (which indicates the WebView wrapper version)
 * OR explicitly contains "; wv)" or " (wv)"
 */
export function isAndroidWebView(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent;

    // Specific Android WebView indicators
    const isAndroid = /Android/i.test(ua);
    const isWebView = /wv/i.test(ua) || /Version\/[\d.]+/i.test(ua);
    const isChrome = /Chrome/i.test(ua);

    // Additional check: Chrome on Android mobile usually has 'Safari' but not 'Version/'
    // WebView usually has 'Version/' and lacks 'Safari' (or has it but also has 'wv')

    return isAndroid && (isWebView || (isChrome && !/Safari/i.test(ua)));
}
