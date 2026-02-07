import { useState } from 'react';
// DashboardLayout removed
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { SwipeableLeadCard } from '@/components/leads/SwipeableLeadCard';
import { MobileLeadsHeader } from '@/components/leads/MobileLeadsHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadsTable } from '@/hooks/useLeadsTable';

export default function PendingPayments() {
    const isMobile = useIsMobile();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [editingLead, setEditingLead] = useState<any>(null);
    const [viewingLead, setViewingLead] = useState<any>(null);
    const { tableName } = useLeadsTable();

    const { data: leadsData, isLoading, refetch } = useLeads({
        search: searchTerm,
        pendingPaymentOnly: true,
        pageSize: 1000
    });
    const leads = leadsData?.leads || [];

    const pendingLeads = leads?.filter(lead => {
        const projected = lead.revenue_projected || 0;
        const received = lead.revenue_received || 0;
        return projected > received && received > 0;
    }) || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
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
                    title="Pending Payments"
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedCount={selectedLeads.size}
                />

                {/* Mobile Card View */}
                {isMobile ? (
                    <div className="space-y-3">
                        {pendingLeads.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No pending payments found.</p>
                            </div>
                        ) : (
                            pendingLeads.map((lead: any) => {
                                const pending = (lead.revenue_projected || 0) - (lead.revenue_received || 0);
                                return (
                                    <div key={lead.id} className="space-y-2">
                                        <SwipeableLeadCard
                                            lead={lead}
                                            isSelected={selectedLeads.has(lead.id)}
                                            onToggleSelect={() => toggleLead(lead.id)}
                                            onViewDetails={() => setViewingLead(lead)}
                                            onEdit={() => setEditingLead(lead)}
                                            onStatusChange={(status) => handleStatusChange(lead.id, status)}
                                            variant="education"
                                        />
                                        {/* Payment info overlay */}
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 -mt-1 mx-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Pending Amount:</span>
                                                <span className="font-bold text-destructive">{formatCurrency(pending)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-muted-foreground">Received: {formatCurrency(lead.revenue_received || 0)}</span>
                                                <span className="text-muted-foreground">Projected: {formatCurrency(lead.revenue_projected || 0)}</span>
                                            </div>
                                            <Button size="sm" className="w-full mt-2 gradient-primary">
                                                Send Reminder
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Desktop Table View */
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>College</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Received</TableHead>
                                        <TableHead className="text-right">Projected</TableHead>
                                        <TableHead className="text-right">Pending</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No pending payments found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingLeads.map((lead) => {
                                            const projected = lead.revenue_projected || 0;
                                            const received = lead.revenue_received || 0;
                                            const pending = projected - received;

                                            return (
                                                <TableRow key={lead.id}>
                                                    <TableCell className="font-medium">{lead.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-sm">
                                                            {lead.email && (
                                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                                    <Mail className="h-3 w-3" /> {lead.email}
                                                                </span>
                                                            )}
                                                            {lead.phone && (
                                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                                    <Phone className="h-3 w-3" /> {lead.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{lead.college || '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize">
                                                            {lead.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(received)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {formatCurrency(projected)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-destructive">
                                                        {formatCurrency(pending)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" className="gradient-primary">
                                                            Send Reminder
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
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
                owners={[]}
            />
        </>
    );
}
