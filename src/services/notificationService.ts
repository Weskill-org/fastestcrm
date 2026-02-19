import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'lead_assignment';
    leadId?: string;
}

export const notificationService = {
    /**
     * Creates a new notification for a user
     */
    createNotification: async ({
        userId,
        title,
        message,
        type = 'info',
        leadId
    }: CreateNotificationParams) => {
        try {
            const { error } = await supabase
                .from('notifications' as any)
                .insert({
                    user_id: userId,
                    title,
                    message,
                    type,
                    read: false,
                    lead_id: leadId
                });

            if (error) {
                console.error('Error creating notification:', error);
                // We don't throw here to prevent disrupting the main flow
                // Notifications are "nice to have" and shouldn't fail the primary action
                return { success: false, error };
            }

            return { success: true };
        } catch (error) {
            console.error('Unexpected error creating notification:', error);
            return { success: false, error };
        }
    },

    /**
     * Bulk create notifications (e.g., when assigning multiple leads to one user, 
     * though typically we might want just one summary notification or one per lead. 
     * For now, we'll keep it simple with single creation or looped creation).
     */
    createBatchNotifications: async (notifications: CreateNotificationParams[]) => {
        try {
            const { error } = await supabase
                .from('notifications' as any)
                .insert(
                    notifications.map(n => ({
                        user_id: n.userId,
                        title: n.title,
                        message: n.message,
                        type: n.type || 'info',
                        read: false,
                        lead_id: n.leadId
                    }))
                );

            if (error) {
                console.error('Error batch creating notifications:', error);
                return { success: false, error };
            }

            return { success: true };

        } catch (error) {
            console.error('Unexpected error batch creating notifications:', error);
            return { success: false, error };
        }
    }
};
