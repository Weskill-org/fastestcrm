import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Filter, X, ChevronLeft, ChevronRight, Users, Trash2
} from 'lucide-react';

import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Constants } from '@/integrations/supabase/types';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { UploadLeadsDialog } from '@/components/leads/UploadLeadsDialog';
import { AssignLeadsDialog } from '@/components/leads/AssignLeadsDialog';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { useCompany } from '@/hooks/useCompany';

import { useSearchParams } from 'react-router-dom';

export default function GenericAllLeads() {
    const { company } = useCompany();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get values from URL or defaults
    const searchQuery = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const selectedOwners = new Set(searchParams.getAll('owner'));
    const selectedStatuses = new Set(searchParams.getAll('status'));
    const selectedProducts = new Set(searchParams.getAll('product'));

    // Local state only for immediate input usage (debounced later)
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const debouncedSearchQuery = useDebounce(localSearch, 500);

    // Sync debounced search to URL
    // We need useEffect to update URL when debounce finishes if it differs
    // But be careful of infinite loops. 
    // Actually, simpler pattern: Update local state on type, useEffect to update URL on debounce change.

    // Better pattern for this refactor to avoid complex effects:
    // Keep using simple state for the input, and useEffect to push to URL.
    // OR just push to URL on change? No, that floods history.
    // Let's stick to the plan: derive from URL is source of truth.

    // Wait, if I derive from URL, typing in input needs to update URL? 
    // If I update URL on every keystroke it's bad.
    // So: Input value -> local state. 
    // Debounced value -> Effect -> Update URL.
    // URL -> Query.

    const pageSize = 25;
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const { tableName } = useLeadsTable();

    // Effect to sync debounced search to URL
    // We only want to update if the value in URL is different from debounced value
    // AND we are the ones who initiated the change (not a nav event).
    // Actually simpler: When debouncedSearchQuery changes, update URL.
    useEffect(() => { // Need to import useEffect
        if (debouncedSearchQuery !== searchQuery) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                if (debouncedSearchQuery) {
                    newParams.set('q', debouncedSearchQuery);
                } else {
                    newParams.delete('q');
                }
                newParams.set('page', '1'); // Reset page on search
                return newParams;
            });
        }
    }, [debouncedSearchQuery, setSearchParams, searchQuery]);

    // Update local search if URL changes externally (e.g. back button)
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

            // Fetch owners (profiles)
            const { data: ownersData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('company_id', company.id)
                .not('full_name', 'is', null);

            let activeOwners = ownersData || [];
            if (activeOwners.length > 0) {
                // Filter out deleted users (those who don't have a role in user_roles)
                const ownerIds = activeOwners.map(o => o.id);
                const { data: rolesData } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .in('user_id', ownerIds);

                const activeUserIds = new Set(rolesData?.map(r => r.user_id));
                activeOwners = activeOwners.filter(o => activeUserIds.has(o.id));
            }

            const { data: products } = await supabase
                .from('products')
                .select('name')
                .eq('company_id', company.id)
                .order('name');

            const { data: statusesData } = await (supabase
                .from('company_lead_statuses' as any)
                .select('label, value, category, order_index')
                .eq('company_id', company.id)
                .order('order_index'));

            // Add default if no custom statuses found (fallback safe)
            const statuses = statusesData && statusesData.length > 0
                ? statusesData.map((s: any) => ({
                    label: s.label,
                    value: s.value,
                    group: s.category
                }))
                : Constants.public.Enums.lead_status.map(s => ({ label: s.replace('_', ' '), value: s, group: 'System' }));

            return {
                owners: activeOwners.map(o => ({ label: o.full_name || 'Unknown', value: o.id })),
                products: Array.from(new Set(((products as any[]) || []).map(p => p.name))).map(name => ({ label: name, value: name })),
                statuses: statuses
            };
        },
        enabled: !!company?.id
    });

    const { data: leadsData, isLoading, refetch } = useLeads({
        search: searchQuery, // Use URL value directly? Or debounced? 
        // Logic: The URL is updated by debounce. So using URL value is effectively using debounced value, 
        // with the added benefit of being instant on page load.
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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">All Leads</h1>
                    <div className="flex gap-2">
                        {selectedLeads.size > 0 && (
                            <>
                                {(userRole === 'company' || userRole === 'company_subadmin') && (
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteLeads}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete {selectedLeads.size}
                                    </Button>
                                )}
                                <Button onClick={() => setAssignDialogOpen(true)} variant="secondary">
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign {selectedLeads.size} to...
                                </Button>
                            </>
                        )}
                        <UploadLeadsDialog />
                        <AddLeadDialog />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search leads..."
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {filterOptions && (
                                <>
                                    <MultiSelectFilter
                                        title="Owner"
                                        options={filterOptions.owners}
                                        selectedValues={selectedOwners}
                                        onSelectionChange={handleSetOwners}
                                    />
                                    <MultiSelectFilter
                                        title="Status"
                                        options={filterOptions.statuses}
                                        selectedValues={selectedStatuses}
                                        onSelectionChange={handleSetStatuses}
                                    />
                                    <MultiSelectFilter
                                        title="Product"
                                        options={filterOptions.products}
                                        selectedValues={selectedProducts}
                                        onSelectionChange={handleSetProducts}
                                    />
                                    {(selectedOwners.size > 0 || selectedStatuses.size > 0 || selectedProducts.size > 0) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchParams(prev => {
                                                    const newParams = new URLSearchParams(prev);
                                                    newParams.delete('owner');
                                                    newParams.delete('status');
                                                    newParams.delete('product');
                                                    newParams.set('page', '1');
                                                    return newParams;
                                                });
                                                // Also reset local search? No, reset button usually just clears filters not search? 
                                                // The original code was:
                                                // setSelectedOwners(new Set());
                                                // setSelectedStatuses(new Set());
                                                // setSelectedProducts(new Set());
                                                // So it only cleared filters, NOT search.
                                            }}
                                            className="h-8 px-2 lg:px-3"
                                        >
                                            Reset
                                            <X className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <LeadsTable
                            leads={leads}
                            loading={isLoading}
                            selectedLeads={selectedLeads}
                            onSelectionChange={setSelectedLeads}
                            owners={filterOptions?.owners || []}
                        />
                    </CardContent>
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} leads
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages || isLoading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <AssignLeadsDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                selectedLeadIds={Array.from(selectedLeads)}
                onSuccess={() => setSelectedLeads(new Set())}
            />
        </DashboardLayout>
    );
}
