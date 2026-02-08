import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import type { RealEstateLead } from '../components/RealEstateLeadsTable';

interface UseRealEstateLeadsOptions {
  search?: string;
  statusFilter?: string | string[];
  ownerFilter?: string[];
  propertyTypeFilter?: string[];
  page?: number;
  pageSize?: number;
  accessibleUserIds?: string[];
  canViewAll?: boolean;
}

export function useRealEstateLeads({
  search,
  statusFilter,
  ownerFilter,
  propertyTypeFilter,
  page = 1,
  pageSize = 25,
}: UseRealEstateLeadsOptions = {}) {
  const { company, loading: companyLoading } = useCompany();

  const query = useQuery({
    queryKey: [
      'real-estate-leads',
      search,
      statusFilter,
      ownerFilter,
      propertyTypeFilter,
      page,
      pageSize,
      company?.id
    ],
    queryFn: async (): Promise<{ leads: RealEstateLead[]; count: number }> => {
      if (!company?.id) {
        console.warn('[useRealEstateLeads] No company context - returning empty results');
        return { leads: [], count: 0 };
      }

      // Convert statusFilter to single string if possible, or null/undefined
      // The RPC expects `status_filter text`. If array is passed, we take the first one or null.
      // This matches previous behavior in RealEstateAllLeads.tsx which passed `undefined` for multiple selections.
      let rpcStatusFilter: string | null = null;
      if (statusFilter && statusFilter !== 'all') {
        if (Array.isArray(statusFilter)) {
          if (statusFilter.length === 1) rpcStatusFilter = statusFilter[0];
          // if > 1, we pass null -> fetch all (as per previous logic limitation)
        } else {
          rpcStatusFilter = statusFilter;
        }
      }

      // Use direct query instead of RPC to avoid TypeScript issues
      let query = supabase
        .from('leads_real_estate')
        .select('*, sales_owner:profiles!leads_real_estate_sales_owner_id_fkey(full_name)', { count: 'exact' })
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (rpcStatusFilter) {
        query = query.eq('status', rpcStatusFilter);
      }

      if (ownerFilter && ownerFilter.length > 0) {
        query = query.in('sales_owner_id', ownerFilter);
      }

      if (propertyTypeFilter && propertyTypeFilter.length > 0) {
        query = query.in('property_type', propertyTypeFilter);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,property_name.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[useRealEstateLeads] Query error:', error);
        throw error;
      }

      return {
        leads: (data as unknown as RealEstateLead[]) || [],
        count: count || 0
      };
    },
    enabled: !companyLoading && !!company?.id,
    placeholderData: (prev) => prev,
    retry: 2,
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: query.isLoading || companyLoading,
    refetch: query.refetch,
  };
}
