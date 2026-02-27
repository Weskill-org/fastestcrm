/**
 * Browser Web Notification helper.
 * Wraps the native Notification API with permission handling.
 * All functions are safe to call even if the browser does not support the API.
 */

const isSupported = (): boolean => 'Notification' in window;

/**
 * Requests permission to show browser notifications.
 * Resolves to the permission status: 'granted', 'denied', or 'default'.
 */
export async function requestWebNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!isSupported()) return 'unsupported';
    if (Notification.permission !== 'default') return Notification.permission;

    try {
        return await Notification.requestPermission();
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return Notification.permission;
    }
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
