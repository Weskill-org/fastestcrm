import { useState, useEffect } from 'react';
// DashboardLayout removed
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Constants } from '@/integrations/supabase/types';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { UploadLeadsDialog } from '@/components/leads/UploadLeadsDialog';
import { AssignLeadsDialog } from '@/components/leads/AssignLeadsDialog';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { SwipeableLeadCard } from '@/components/leads/SwipeableLeadCard';
import { MobileLeadsHeader } from '@/components/leads/MobileLeadsHeader';
import { FloatingAddButton } from '@/components/leads/FloatingAddButton';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { useCompany } from '@/hooks/useCompany';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog';

import { useSearchParams } from 'react-router-dom';

export default function GenericAllLeads() {
    const { company } = useCompany();
    const isMobile = useIsMobile();
    const [searchParams, setSearchParams] = useSearchParams();
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    // Get values from URL or defaults
    const searchQuery = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const selectedOwners = new Set(searchParams.getAll('owner'));
    const selectedStatuses = new Set(searchParams.getAll('status'));
    const selectedProducts = new Set(searchParams.getAll('product'));

    // Local state only for immediate input usage (debounced later)
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const debouncedSearchQuery = useDebounce(localSearch, 500);

    const pageSize = 25;
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<any>(null);
    const [viewingLead, setViewingLead] = useState<any>(null);
    const { tableName } = useLeadsTable();

    // Effect to sync debounced search to URL
    useEffect(() => {
        if (debouncedSearchQuery !== searchQuery) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                if (debouncedSearchQuery) {
                    newParams.set('q', debouncedSearchQuery);
                } else {
                    newParams.delete('q');
                }
                newParams.set('page', '1');
                return newParams;
            });
        }
    }, [debouncedSearchQuery, setSearchParams, searchQuery]);

    // Update local search if URL changes externally
    useEffect(() => {
        if (searchQuery !== localSearch) {
            setLocalSearch(searchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);


    // Handlers for filters
    const handleSetOwners = (newOwners: Set<string>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('owner');
            newOwners.forEach(o => newParams.append('owner', o));
            newParams.set('page', '1');
            return newParams;
        });
    };

    const handleSetStatuses = (newStatuses: Set<string>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('status');
            newStatuses.forEach(s => newParams.append('status', s));
            newParams.set('page', '1');
            return newParams;
        });
    };

    const handleSetProducts = (newProducts: Set<string>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('product');
            newProducts.forEach(p => newParams.append('product', p));
            newParams.set('page', '1');
            return newParams;
        });
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', newPage.toString());
            return newParams;
        });
    }

    // Fetch filter options
    const { data: filterOptions } = useQuery({
        queryKey: ['leadsFilterOptions', company?.id],
        queryFn: async () => {
            if (!company?.id) return null;

            // Fetch independent data in parallel
            const [activeOwners, products, statusesData] = await Promise.all([
                // Fetch owners (profiles)
                (async () => {
                    const { data: ownersData } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .eq('company_id', company.id)
                        .not('full_name', 'is', null);

                    let owners = ownersData || [];
                    if (owners.length > 0) {
                        const ownerIds = owners.map(o => o.id);
                        const { data: rolesData } = await supabase
                            .from('user_roles')
                            .select('user_id')
                            .in('user_id', ownerIds);

                        const activeUserIds = new Set(rolesData?.map(r => r.user_id));
                        owners = owners.filter(o => activeUserIds.has(o.id));
                    }
                    return owners;
                })(),
                // Fetch products
                (async () => {
                    const { data } = await supabase
                        .from('products')
                        .select('name')
                        .eq('company_id', company.id)
                        .order('name');
                    return (data as any[]) || [];
                })(),
                // Fetch statuses
                (async () => {
                    const { data } = await (supabase
                        .from('company_lead_statuses' as any)
                        .select('label, value, category, order_index')
                        .eq('company_id', company.id)
                        .order('order_index'));
                    return data || [];
                })()
            ]);

            const statuses = statusesData.length > 0
                ? statusesData.map((s: any) => ({
                    label: s.label,
                    value: s.value,
                    group: s.category
                }))
                : Constants.public.Enums.lead_status.map(s => ({ label: s.replace('_', ' '), value: s, group: 'System' }));

            return {
                owners: activeOwners.map(o => ({ label: o.full_name || 'Unknown', value: o.id })),
                products: Array.from(new Set(products.map((p: any) => p.name))).map(name => ({ label: name, value: name })),
                statuses: statuses
            };
        },
        enabled: !!company?.id
    });

    const { data: leadsData, isLoading, refetch } = useLeads({
        search: searchQuery,
        statusFilter: selectedStatuses.size === 1 ? Array.from(selectedStatuses)[0] : undefined,
        ownerFilter: Array.from(selectedOwners),
        productFilter: Array.from(selectedProducts),
        page,
        pageSize
    });
    const leads = leadsData?.leads || [];
    const totalCount = leadsData?.count || 0;

    const totalPages = Math.ceil(totalCount / pageSize);
    const { user } = useAuth();
    const { data: userRole } = useUserRole();

    const handleDeleteLeads = async () => {
        if (!confirm('Are you sure you want to delete the selected leads? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from(tableName as any)
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
                    title="All Leads"
                    searchValue={localSearch}
                    onSearchChange={setLocalSearch}
                    filterOptions={filterOptions ? {
                        owners: filterOptions.owners,
                        statuses: filterOptions.statuses,
                        products: filterOptions.products
                    } : undefined}
                    selectedOwners={selectedOwners}
                    onOwnersChange={handleSetOwners}
                    selectedStatuses={selectedStatuses}
                    onStatusesChange={handleSetStatuses}
                    selectedProducts={selectedProducts}
                    onProductsChange={handleSetProducts}
                    selectedCount={selectedLeads.size}
                    onDelete={handleDeleteLeads}
                    onAssign={() => setAssignDialogOpen(true)}
                    canDelete={userRole === 'company' || userRole === 'company_subadmin'}
                    uploadButton={<UploadLeadsDialog />}
                    addButton={!isMobile ? <AddLeadDialog /> : null}
                />

                {/* Mobile Card View */}
                {isMobile ? (
                    <div className="space-y-3">
                        {leads.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No leads found. Add your first lead to get started!</p>
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
                                    variant="education"
                                />
                            ))
                        )}
                    </div>
                ) : (
                    /* Desktop Table View */
                    <Card>
                        <CardContent className="pt-6">
                            <LeadsTable
                                leads={leads}
                                loading={isLoading}
                                selectedLeads={selectedLeads}
                                onSelectionChange={setSelectedLeads}
                                owners={filterOptions?.owners || []}
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
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
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
                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || isLoading}
                        >
                            <span className="hidden sm:inline mr-1">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <AssignLeadsDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                selectedLeadIds={Array.from(selectedLeads)}
                onSuccess={() => setSelectedLeads(new Set())}
            />

            <EditLeadDialog
                open={!!editingLead}
                onOpenChange={(open) => !open && setEditingLead(null)}
                lead={editingLead}
            />

            <LeadDetailsDialog
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
            <AddLeadDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
            />
        </>
    );
}
