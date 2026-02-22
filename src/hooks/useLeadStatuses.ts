import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';

export interface CompanyLeadStatus {
    id: string;
    company_id: string;
    label: string;
    value: string;
    color: string;
    category: 'new' | 'paid' | 'interested' | 'other';
    sub_statuses: string[];
    order_index: number;
    is_active: boolean;
    status_type: 'simple' | 'date_derived' | 'time_derived';
    web_push_enabled: boolean;
}

export function useLeadStatuses() {
    const { company } = useCompany();

    const { data: statuses, isLoading, error } = useQuery({
        queryKey: ['company-lead-statuses', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];

            const { data, error } = await (supabase
                .from('company_lead_statuses' as any)
                .select('*')
                .eq('company_id', company.id)
                .order('order_index', { ascending: true }));

            if (error) throw error;
            return data as unknown as CompanyLeadStatus[];
        },
        enabled: !!company?.id,
        // Cache for a bit to avoid constant refetching on every dropdown open
        staleTime: 1000 * 60 * 5,
    });

    // Helper to get color for a status value
    const getStatusColor = useCallback((value: string) => {
        const status = statuses?.find(s => s.value === value);
        return status?.color || '#6B7280'; // Default gray
    }, [statuses]);

    // Helper to get label
    const getStatusLabel = useCallback((value: string) => {
        const status = statuses?.find(s => s.value === value);
        return status?.label || value.replace(/_/g, ' ');
    }, [statuses]);

    return {
        statuses: statuses || [],
        isLoading,
        error,
        getStatusColor,
        getStatusLabel
    };
}
