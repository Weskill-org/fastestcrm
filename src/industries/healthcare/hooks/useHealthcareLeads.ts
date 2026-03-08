import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import type { HealthcareLead } from '../components/HealthcareLeadsTable';

interface UseHealthcareLeadsOptions {
  search?: string;
  statusFilter?: string | string[];
  ownerFilter?: string[];
  departmentFilter?: string[];
  genderFilter?: string[];
  page?: number;
  pageSize?: number;
  accessibleUserIds?: string[];
  canViewAll?: boolean;
}

export function useHealthcareLeads({
  search,
  statusFilter,
  ownerFilter,
  departmentFilter,
  genderFilter,
  page = 1,
  pageSize = 25,
  accessibleUserIds = [],
  canViewAll = true,
}: UseHealthcareLeadsOptions = {}) {
  const { company, loading: companyLoading } = useCompany();

  const query = useQuery({
    queryKey: [
      'healthcare-leads', search, statusFilter, ownerFilter,
      departmentFilter, genderFilter, page, pageSize,
      company?.id, accessibleUserIds, canViewAll,
    ],
    queryFn: async (): Promise<{ leads: HealthcareLead[]; count: number }> => {
      if (!company?.id) return { leads: [], count: 0 };

      let query = supabase
        .from('leads_healthcare' as any)
        .select('*, sales_owner:profiles!leads_healthcare_sales_owner_id_fkey(full_name)', { count: 'exact' })
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

      if (departmentFilter && departmentFilter.length > 0) {
        query = query.in('department', departmentFilter);
      }

      if (genderFilter && genderFilter.length > 0) {
        query = query.in('gender', genderFilter);
      }

      if (!canViewAll && accessibleUserIds.length > 0) {
        query = query.in('sales_owner_id', accessibleUserIds);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,condition.ilike.%${search}%,department.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        leads: (data as unknown as HealthcareLead[]) || [],
        count: count || 0,
      };
    },
    enabled: !companyLoading && !!company?.id,
    placeholderData: (prev) => prev,
    retry: 2,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: query.isLoading || companyLoading,
    refetch: query.refetch,
  };
}
