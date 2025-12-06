import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useUserRole() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['userRole', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id) // Assuming profile id is same as user id, or user_id column?
                // Wait, let's check profile table definition again.
                // It has user_id column. And id column. Usually id is uuid and matches auth.uid() in many setups, 
                // but let's check if id is the primary key and if it matches auth.uid().
                // The type definition showed:
                // id: string
                // user_id: string
                // If I look at Insert: id is optional, user_id is required.
                // Let's assume we should query by user_id just to be safe, or check if id is a foreign key to auth.users.
                // Actually, usually profiles.id IS the auth.uid. But let's query by user_id if it exists to be sure.
                // Wait, looking at types.ts again:
                // profiles: { Row: { id: string, role: ..., user_id: string } }
                // So it has both. I'll query by user_id to be safe.
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data?.role as AppRole;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}

export const HIERARCHY_LEVELS: Record<AppRole, number> = {
    'company': 100,
    'company_subadmin': 90,
    'cbo': 80,
    'vp': 70,
    'avp': 60,
    'dgm': 50,
    'agm': 40,
    'sm': 30,
    'tl': 20,
    'bde': 10,
    'intern': 5,
    'ca': 0
};

export function isRoleAllowedToMarkPaid(role: AppRole | null | undefined): boolean {
    if (!role) return false;
    // "Above team lead" means > 20
    return HIERARCHY_LEVELS[role] > 20;
}
