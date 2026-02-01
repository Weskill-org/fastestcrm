import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { useLeads } from '@/hooks/useLeads';
import { useCompany } from '@/hooks/useCompany';
import { Tables } from '@/integrations/supabase/types';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { RealEstateLeadsTable } from '@/industries/real_estate/components/RealEstateLeadsTable';
import { useRealEstateLeads } from '@/industries/real_estate/hooks/useRealEstateLeads';
import { SwipeableLeadCard } from '@/components/leads/SwipeableLeadCard';
import { MobileLeadsHeader } from '@/components/leads/MobileLeadsHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog';
import { toast } from 'sonner';
import { useLeadsTable } from '@/hooks/useLeadsTable';

type Lead = Tables<'leads'> & {
    sales_owner?: {
        full_name: string | null;
    } | null;
};

export default function Paid() {
    const { company } = useCompany();
    const isMobile = useIsMobile();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [editingLead, setEditingLead] = useState<any>(null);
    const [viewingLead, setViewingLead] = useState<any>(null);
    const { tableName } = useLeadsTable();

    const isRealEstate = company?.industry === 'real_estate';

    // Fetch confirmed 'paid' statuses
    const { data: paidStatuses } = useQuery({
        queryKey: ['paid-statuses', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data } = await supabase
                .from('company_lead_statuses' as any)
                .select('value')
                .eq('company_id', company.id)
                .eq('category', 'paid');

            const statuses = data?.map((s: any) => s.value) || [];
            return statuses.length > 0 ? statuses : ['paid'];
        },
        enabled: !!company?.id
    });

    const statusFilter = paidStatuses && paidStatuses.length > 0 ? paidStatuses : ['paid'];

    const hookOptions = {
        search: searchQuery,
        statusFilter: statusFilter
    };

    const genericLeadsQuery = useLeads(hookOptions);
    const realEstateLeadsQuery = useRealEstateLeads(hookOptions);

    const isLoading = isRealEstate ? realEstateLeadsQuery.isLoading : genericLeadsQuery.isLoading;
    const refetch = isRealEstate ? realEstateLeadsQuery.refetch : genericLeadsQuery.refetch;
    const leads = isRealEstate 
        ? (realEstateLeadsQuery.data?.leads || [])
        : (genericLeadsQuery.data?.leads || []);

    const { data: owners } = useQuery({
        queryKey: ['leadsFilterOptionsOwners', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];

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

            return activeOwners.map(o => ({ label: o.full_name || 'Unknown', value: o.id }));
        },
        enabled: !!company?.id
    });

    const toggleLead = (id: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    };

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from(tableName as any)
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;
            toast.success('Status updated successfully');
            await refetch();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
                <MobileLeadsHeader
                    title="Paid Leads"
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterOptions={owners ? { owners } : undefined}
                    selectedCount={selectedLeads.size}
                />

                {/* Mobile Card View */}
                {isMobile ? (
                    <div className="space-y-3">
                        {leads.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No paid leads found.</p>
                            </div>
                        ) : (
                            leads.map((lead: any) => (
                                <SwipeableLeadCard
                                    key={lead.id}
                                    lead={lead}
                                    isSelected={selectedLeads.has(lead.id)}
                                    onToggleSelect={() => toggleLead(lead.id)}
                                    onViewDetails={() => setViewingLead(lead)}
                                    onEdit={() => setEditingLead(lead)}
                                    onStatusChange={(status) => handleStatusChange(lead.id, status)}
                                    owners={owners}
                                    variant={isRealEstate ? 'real_estate' : 'education'}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    /* Desktop Table View */
                    <Card>
                        <CardContent className="pt-6">
                            {isRealEstate ? (
                                <RealEstateLeadsTable
                                    leads={realEstateLeadsQuery.data?.leads || []}
                                    loading={realEstateLeadsQuery.isLoading}
                                    selectedLeads={selectedLeads}
                                    onSelectionChange={setSelectedLeads}
                                    owners={owners}
                                    onRefetch={realEstateLeadsQuery.refetch}
                                />
                            ) : (
                                <LeadsTable
                                    leads={(genericLeadsQuery.data?.leads || []) as Lead[]}
                                    loading={genericLeadsQuery.isLoading}
                                    selectedLeads={selectedLeads}
                                    onSelectionChange={setSelectedLeads}
                                    owners={owners}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <EditLeadDialog
                open={!!editingLead}
                onOpenChange={(open) => !open && setEditingLead(null)}
                lead={editingLead}
            />

            <LeadDetailsDialog
                open={!!viewingLead}
                onOpenChange={(open) => !open && setViewingLead(null)}
                lead={viewingLead}
                owners={owners || []}
            />
        </DashboardLayout>
    );
}
