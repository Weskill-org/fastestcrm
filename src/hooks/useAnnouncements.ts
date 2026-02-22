import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Announcement {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'maintenance';
    target_type: string;
    scheduled_at: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Fetches announcements visible to the current user (RLS-filtered by Supabase).
 * Returns only unread announcements (cross-referenced against announcement_reads).
 */
export function useAnnouncements() {
    const { user } = useAuth();
    const qc = useQueryClient();

    const { data: unread = [], isLoading } = useQuery({
        queryKey: ['announcements', user?.id],
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2, // Re-check every 2 minutes
        queryFn: async () => {
            // Fetch visible live announcements (RLS handles targeting + scheduled_at + is_active)
            const { data: visible, error: visibleError } = await supabase
                .from('announcements')
                .select('id, title, body, type, target_type, scheduled_at, is_active, created_at')
                .order('created_at', { ascending: false });

            if (visibleError) throw visibleError;
            if (!visible || visible.length === 0) return [];

            // Fetch which ones this user has already read/dismissed
            const { data: reads } = await supabase
                .from('announcement_reads')
                .select('announcement_id')
                .eq('user_id', user!.id);

            const readIds = new Set((reads || []).map((r: any) => r.announcement_id));
            return (visible as Announcement[]).filter(a => !readIds.has(a.id));
        },
    });

    /** Mark an announcement as dismissed for this user */
    const dismiss = useMutation({
        mutationFn: async (announcementId: string) => {
            const { error } = await supabase.from('announcement_reads').upsert({
                announcement_id: announcementId,
                user_id: user!.id,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['announcements', user?.id] });
        },
    });

    return { unread, isLoading, dismiss: dismiss.mutate };
}
