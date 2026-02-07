import { useState } from 'react';
// DashboardLayout removed
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  RealEstateLeadsTable,
} from './components/RealEstateLeadsTable';
import { RealEstateAddLeadDialog } from './components/RealEstateAddLeadDialog';
import { RealEstateUploadLeadsDialog } from './components/RealEstateUploadLeadsDialog';
import { RealEstateAssignLeadsDialog } from './components/RealEstateAssignLeadsDialog';
import { RealEstateEditLeadDialog } from './components/RealEstateEditLeadDialog';
import { RealEstateLeadDetailsDialog } from './components/RealEstateLeadDetailsDialog';
import { useHierarchy } from '@/hooks/useHierarchy';
import { useRealEstateLeads } from './hooks/useRealEstateLeads';
import { REAL_ESTATE_PROPERTY_TYPES } from './config';
import { MobileLeadsHeader } from '@/components/leads/MobileLeadsHeader';
import { SwipeableLeadCard } from '@/components/leads/SwipeableLeadCard';
import { FloatingAddButton } from '@/components/leads/FloatingAddButton';

export default function RealEstateAllLeads() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [viewingLead, setViewingLead] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { company } = useCompany();
  const { data: userRole } = useUserRole();
  const isMobile = useIsMobile();

  // Hierarchy Check
  const { accessibleUserIds, canViewAll, loading: hierarchyLoading } = useHierarchy();

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['realEstateLeadsFilterOptions', company?.id, canViewAll, accessibleUserIds],
    queryFn: async () => {
      if (!company?.id) return null;

      // Fetch owners (profiles)
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', company.id)
        .not('full_name', 'is', null);

      let activeOwners = ownersData || [];
      if (activeOwners.length > 0) {
        const ownerIds = activeOwners.map(o => o.id);
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('user_id', ownerIds);

        const activeUserIds = new Set(rolesData?.map(r => r.user_id));
        activeOwners = activeOwners.filter(o => activeUserIds.has(o.id));
      }

      // Filter owners based on hierarchy for the dropdown
      if (!canViewAll && accessibleUserIds.length > 0) {
        const accessibleSet = new Set(accessibleUserIds);
        activeOwners = activeOwners.filter(o => accessibleSet.has(o.id));
      }

      const { data: statusesData } = await supabase
        .from('company_lead_statuses' as any)
        .select('label, value, category, order_index')
        .eq('company_id', company.id)
        .order('order_index');

      const statuses = statusesData && statusesData.length > 0
        ? statusesData.map((s: any) => ({
          label: s.label,
          value: s.value,
          group: s.category
        }))
        : [];

      return {
        owners: activeOwners.map(o => ({ label: o.full_name || 'Unknown', value: o.id })),
        statuses,
        propertyTypes: REAL_ESTATE_PROPERTY_TYPES.map(t => ({ label: t, value: t })),
      };
    },
    enabled: !!company?.id && !hierarchyLoading
  });

  const { data: leadsData, isLoading, refetch } = useRealEstateLeads({
    search: debouncedSearchQuery,
    statusFilter: selectedStatuses.size === 1 ? Array.from(selectedStatuses)[0] : undefined,
    ownerFilter: Array.from(selectedOwners),
    propertyTypeFilter: Array.from(selectedPropertyTypes),
    page,
    pageSize,
    accessibleUserIds,
    canViewAll
  });

  const leads = leadsData?.leads || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDeleteLeads = async () => {
    if (!confirm('Are you sure you want to delete the selected leads? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads_real_estate')
        .delete()
        .in('id', Array.from(selectedLeads));

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLeads.size} leads`);
      setSelectedLeads(new Set());
      await refetch();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads_real_estate')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      toast.success('Status updated successfully');
      await refetch();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
        <MobileLeadsHeader
          title="Real Estate Leads"
          icon={<Home className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={filterOptions ? {
            owners: filterOptions.owners,
            statuses: filterOptions.statuses,
            propertyTypes: filterOptions.propertyTypes
          } : undefined}
          selectedOwners={selectedOwners}
          onOwnersChange={setSelectedOwners}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          selectedPropertyTypes={selectedPropertyTypes}
          onPropertyTypesChange={setSelectedPropertyTypes}
          selectedCount={selectedLeads.size}
          onDelete={handleDeleteLeads}
          onAssign={() => setAssignDialogOpen(true)}
          canDelete={userRole === 'company' || userRole === 'company_subadmin'}
          addButton={!isMobile ? (
            <div className="flex items-center gap-2">
              <RealEstateUploadLeadsDialog />
              <RealEstateAddLeadDialog />
            </div>
          ) : null}
        />

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No leads found. Add your first real estate lead to get started!</p>
              </div>
            ) : (
              leads.map((lead) => (
                <SwipeableLeadCard
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLeads.has(lead.id)}
                  onToggleSelect={() => toggleLead(lead.id)}
                  onViewDetails={() => setViewingLead(lead)}
                  onEdit={() => setEditingLead(lead)}
                  onStatusChange={(status) => handleStatusChange(lead.id, status)}
                  owners={filterOptions?.owners}
                  variant="real_estate"
                />
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <Card>
            <CardContent className="pt-6">
              <RealEstateLeadsTable
                leads={leads}
                loading={isLoading}
                selectedLeads={selectedLeads}
                onSelectionChange={setSelectedLeads}
                owners={filterOptions?.owners || []}
                onRefetch={refetch}
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <div className="text-sm font-medium px-2">
              {page} / {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <RealEstateAssignLeadsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedLeadIds={Array.from(selectedLeads)}
        onSuccess={() => setSelectedLeads(new Set())}
      />

      <RealEstateEditLeadDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        lead={editingLead}
        onSuccess={refetch}
      />

      <RealEstateLeadDetailsDialog
        open={!!viewingLead}
        onOpenChange={(open) => !open && setViewingLead(null)}
        lead={viewingLead}
        owners={filterOptions?.owners || []}
      />

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <FloatingAddButton onClick={() => setAddDialogOpen(true)} />
      )}

      {/* Mobile Add Dialog */}
      <RealEstateAddLeadDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
}
