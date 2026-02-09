import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useReminderPolling() {
    const { session } = useAuth();

    useEffect(() => {
        if (!session?.user?.id) return;

        const checkReminders = async () => {
            try {
                console.log('Checking for due reminders...');
                await supabase.functions.invoke('process-reminders');
            } catch (error) {
                console.error('Error triggering reminder check:', error);
            }
        };

        // Initial check
        checkReminders();

        // Poll every 60 seconds
        const interval = setInterval(checkReminders, 60 * 1000);

        return () => clearInterval(interval);
    }, [session?.user?.id]);
}
