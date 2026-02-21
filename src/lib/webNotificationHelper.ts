/**
 * Browser Web Notification helper.
 * Wraps the native Notification API with permission handling.
 * All functions are safe to call even if the browser does not support the API.
 */

const isSupported = (): boolean => 'Notification' in window;

/**
 * Requests permission to show browser notifications.
 * Resolves to `true` if permission is granted, `false` otherwise.
 * Safe to call multiple times – will not prompt again if already granted/denied.
 */
export async function requestWebNotificationPermission(): Promise<boolean> {
    if (!isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Fires a native OS browser notification popup.
 * Silently no-ops if permission is not granted or API is unsupported.
 */
export function sendWebNotification(
    title: string,
    body?: string,
    options?: {
        icon?: string;
        tag?: string;   // deduplication key – browser collapses same-tag notifications
        onClick?: () => void;
    }
): void {
    if (!isSupported() || Notification.permission !== 'granted') return;

    const n = new Notification(title, {
        body,
        icon: options?.icon ?? '/favicon.ico',
        tag: options?.tag,
    });

    if (options?.onClick) {
        n.onclick = () => {
            window.focus();
            options.onClick!();
            n.close();
        };
    } else {
        // Default: focus the tab and close after 5 seconds
        n.onclick = () => {
            window.focus();
            n.close();
        };
    }

    setTimeout(() => n.close(), 8000);
}
