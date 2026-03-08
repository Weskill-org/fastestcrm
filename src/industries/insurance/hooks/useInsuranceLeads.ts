import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import type { InsuranceLead } from '../components/InsuranceLeadsTable';

interface UseInsuranceLeadsOptions {
  search?: string;
  statusFilter?: string | string[];
  ownerFilter?: string[];
  insuranceTypeFilter?: string[];
  page?: number;
  pageSize?: number;
  accessibleUserIds?: string[];
  canViewAll?: boolean;
}

export function useInsuranceLeads({
  search,
  statusFilter,
  ownerFilter,
  insuranceTypeFilter,
  page = 1,
  pageSize = 25,
  accessibleUserIds = [],
  canViewAll = true,
}: UseInsuranceLeadsOptions = {}) {
  const { company, loading: companyLoading } = useCompany();

  const query = useQuery({
    queryKey: [
      'insurance-leads', search, statusFilter, ownerFilter, insuranceTypeFilter,
      page, pageSize, company?.id, accessibleUserIds, canViewAll
    ],
    queryFn: async (): Promise<{ leads: InsuranceLead[]; count: number }> => {
      if (!company?.id) return { leads: [], count: 0 };

      let query = supabase
        .from('leads_insurance' as any)
        .select('*, sales_owner:profiles!leads_insurance_sales_owner_id_fkey(full_name)', { count: 'exact' })
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        if (Array.isArray(statusFilter)) {
          if (statusFilter.length > 0) query = query.in('status', statusFilter);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      if (ownerFilter && ownerFilter.length > 0) {
        query = query.in('sales_owner_id', ownerFilter);
      }

      if (insuranceTypeFilter && insuranceTypeFilter.length > 0) {
        query = query.in('insurance_type', insuranceTypeFilter);
      }

      if (!canViewAll && accessibleUserIds.length > 0) {
        query = query.in('sales_owner_id', accessibleUserIds);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,plan_name.ilike.%${search}%,insurance_type.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) { console.error('[useInsuranceLeads] Query error:', error); throw error; }

      return { leads: (data as unknown as InsuranceLead[]) || [], count: count || 0 };
    },
    enabled: !companyLoading && !!company?.id,
    placeholderData: (prev) => prev,
    retry: 2,
    staleTime: 30000,
  });

  return { ...query, isLoading: query.isLoading || companyLoading, refetch: query.refetch };
}
