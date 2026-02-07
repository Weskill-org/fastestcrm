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

      const { data, error } = await supabase.rpc('get_real_estate_leads', {
        page: page,
        page_size: pageSize,
        search_query: search || null,
        status_filter: rpcStatusFilter,
        owner_filter: ownerFilter && ownerFilter.length > 0 ? ownerFilter : null,
        property_type_filter: propertyTypeFilter && propertyTypeFilter.length > 0 ? propertyTypeFilter : null
      });

      if (error) {
        console.error('[useRealEstateLeads] RPC error:', error);
        throw error;
      }

      // The RPC returns a JSON object { leads: [...], count: N }
      // We need to cast it properly
      const result = data as { leads: any[], count: number };

      return {
        leads: result.leads || [],
        count: result.count || 0
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
