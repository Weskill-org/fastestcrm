import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Constants } from '@/integrations/supabase/types';

export type AppRole = typeof Constants.public.Enums.app_role[number];

export interface HierarchyUser {
    id: string;
    manager_id: string | null;
    role: AppRole;
}

const ROLE_LEVELS: Partial<Record<AppRole, number>> = {
    platform_admin: 0,
    company: 1,
    company_subadmin: 2,
    level_3: 3,
    level_4: 4,
    level_5: 5,
    level_6: 6,
    level_7: 7,
    level_8: 8,
    level_9: 9,
    level_10: 10,
    level_11: 11,
    level_12: 12,
    level_13: 13,
    level_14: 14,
    level_15: 15,
    level_16: 16,
    level_17: 17,
    level_18: 18,
    level_19: 19,
    level_20: 20,
};

export function useHierarchy() {
    const [accessibleUserIds, setAccessibleUserIds] = useState<string[]>([]);
    const [canViewAll, setCanViewAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchHierarchy = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch current user's role and company details safely
            const [myProfileResult, myRoleResult] = await Promise.all([
                supabase.from('profiles').select('company_id').eq('id', user.id).single(),
                supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
            ]);

            const myCompanyId = myProfileResult.data?.company_id;
            let myRole = (myRoleResult.data?.role as AppRole) || null;

            // Fallback: If no role record but has company_id (likely Admin/Owner), default to 'company'
            if (!myRole && myCompanyId) {
                myRole = 'company';
            }

            // If regular user and no company, return empty
            if (!myCompanyId && myRole !== 'platform_admin') {
                setAccessibleUserIds([user.id]);
                setCanViewAll(false);
                setLoading(false);
                return;
            }

            // If Admin/Company Admin, they can view everything
            if (myRole === 'company' || myRole === 'company_subadmin' || myRole === 'platform_admin') {
                setCanViewAll(true);
                // We don't necessarily need to fetch all IDs if they can view all, 
                // but it might be useful for filters. For now, empty list with canViewAll=true implies "All".
                setAccessibleUserIds([]);
                setLoading(false);
                return;
            }

            setCanViewAll(false);

            // 2. Fetch profiles for THIS company to build hierarchy
            // We only need id and manager_id
            const profilesQuery = supabase
                .from('profiles')
                .select('id, manager_id')
                .eq('company_id', myCompanyId);

            const { data: profiles, error: profilesError } = await profilesQuery;
            if (profilesError) throw profilesError;

            // 3. Build adjacency list for the tree: manager_id -> [direct_reports]
            const reportsMap = new Map<string, string[]>();
            profiles?.forEach(p => {
                if (p.manager_id) {
                    if (!reportsMap.has(p.manager_id)) {
                        reportsMap.set(p.manager_id, []);
                    }
                    reportsMap.get(p.manager_id)?.push(p.id);
                }
            });

            // 4. DFS to find all descendants
            const descendants = new Set<string>();
            const queue = [user.id];
            descendants.add(user.id);

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const directReports = reportsMap.get(currentId) || [];

                for (const reportId of directReports) {
                    if (!descendants.has(reportId)) {
                        descendants.add(reportId);
                        queue.push(reportId);
                    }
                }
            }

            setAccessibleUserIds(Array.from(descendants));

        } catch (err) {
            console.error('Error fetching hierarchy:', err);
            // Fallback: minimal access (only self)
            setAccessibleUserIds([user.id]);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchHierarchy();
    }, [fetchHierarchy]);

    return {
        accessibleUserIds,
        canViewAll,
        loading
    };
}
