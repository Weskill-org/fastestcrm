import { useEffect } from 'react';

export default function RedirectToApp() {
    useEffect(() => {
        window.location.href = "https://play.google.com/store/apps/details?id=com.fastestcrm";
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <h1 className="text-xl font-semibold">Redirecting to Google Play Store...</h1>
                <p className="text-muted-foreground">If you are not redirected, <a href="https://play.google.com/store/apps/details?id=com.fastestcrm" className="text-primary hover:underline">click here</a>.</p>
            </div>
        </div>
    );
}
