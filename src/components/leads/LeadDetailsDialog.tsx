import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { Mail, Phone, Building, Calendar, User, CreditCard, Link, MapPin, Home, DollarSign, Megaphone, Globe, Layers, CalendarClock, Pencil, FileText, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MaskedValue } from '@/components/ui/MaskedValue';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useUpdateLead } from '@/hooks/useLeads';
import { useLeadStatuses, CompanyLeadStatus } from '@/hooks/useLeadStatuses';
import { StatusReminderDialog } from './StatusReminderDialog';

type Lead = Tables<'leads'> & Partial<Tables<'leads_real_estate'>> & {
    sales_owner?: {
        full_name: string | null;
    } | null;
};

interface LeadDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: any;
    owners: { label: string; value: string }[];
    maskLeads?: boolean;
    onEdit?: (lead: any) => void;
    onUpdate?: () => void;
}

export function LeadDetailsDialog({ open, onOpenChange, lead, owners, maskLeads = false, onEdit, onUpdate }: LeadDetailsDialogProps) {
    const updateLead = useUpdateLead();
    const { statuses } = useLeadStatuses();

    // Quick Update State
    const [quickStatus, setQuickStatus] = useState<string>('');
    const [quickNotes, setQuickNotes] = useState<string>('');
    const [statusReminderOpen, setStatusReminderOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<CompanyLeadStatus | null>(null);
    const [reminderAt, setReminderAt] = useState<Date | null>(null);

    useEffect(() => {
        if (lead) {
            setQuickStatus(lead.status || 'new');
            setQuickNotes(lead.notes || '');
            setReminderAt(lead.reminder_at ? new Date(lead.reminder_at) : null);
        }
    }, [lead, open]);

    const handleStatusChange = (newStatusValue: string) => {
        const newStatus = statuses?.find(s => s.value === newStatusValue);

        if (newStatus && (newStatus.status_type === 'date_derived' || newStatus.status_type === 'time_derived')) {
            setPendingStatus(newStatus);
            setStatusReminderOpen(true);
        } else {
            setQuickStatus(newStatusValue);
            setReminderAt(null);
        }
    };

    const handleReminderConfirm = (date: Date | null, sendNotification: boolean) => {
        if (pendingStatus) {
            setQuickStatus(pendingStatus.value);
            setReminderAt(date);
        }
        setStatusReminderOpen(false);
        setPendingStatus(null);
    };

    const handleReminderCancel = () => {
        setStatusReminderOpen(false);
        setPendingStatus(null);
    };

    const handleSaveQuickUpdate = async () => {
        if (!lead) return;
        try {
            await updateLead.mutateAsync({
                id: lead.id,
                status: quickStatus as any,
                notes: quickNotes,
                reminder_at: reminderAt ? reminderAt.toISOString() : null,
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to update lead via quick update', error);
        }
    };

    const hasQuickUpdateChanges = lead && (quickStatus !== lead.status || quickNotes !== (lead.notes || '') || (reminderAt?.toISOString() !== (lead.reminder_at ? new Date(lead.reminder_at).toISOString() : null)));

    if (!lead) return null;

    // Helper to format currency
    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper to check if any real estate specific fields exist
    const hasRealEstateData = lead.property_name || lead.property_type || lead.budget_min || lead.budget_max || lead.preferred_location || lead.possession_timeline || lead.purpose || lead.site_visit_date || lead.broker_name || lead.unit_number || lead.deal_value;

    // Helper to check if any marketing data exists
    const hasMarketingData = lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.lead_source || lead.ca_name;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <DialogTitle>Lead Details</DialogTitle>
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={() => onEdit(lead)} className="gap-2 h-8">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Lead
                            </Button>
                        )}
                    </div>
                    <DialogDescription>
                        Detailed information about {lead.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Quick Update Section */}
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-primary/80 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Quick Update
                            </h3>
                            {hasQuickUpdateChanges && (
                                <Button size="sm" onClick={handleSaveQuickUpdate} disabled={updateLead.isPending} className="h-8 gap-1.5">
                                    <Check className="h-3.5 w-3.5" />
                                    {updateLead.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <Select value={quickStatus} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses?.map((s) => (
                                            <SelectItem key={s.id} value={s.value} className="capitalize">{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Notes</span>
                                <Textarea
                                    placeholder="Add quick notes here..."
                                    value={quickNotes}
                                    onChange={(e) => setQuickNotes(e.target.value)}
                                    className="resize-none min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role / Basic Info Section */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-primary/80 border-b pb-1">Contact Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" /> Name
                                </h4>
                                <p className="text-sm font-semibold">{lead.name}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email
                                </h4>
                                <div className="text-sm break-all">
                                    <MaskedValue value={lead.email} type="email" enabled={maskLeads} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Phone
                                </h4>
                                <div className="text-sm">
                                    <MaskedValue value={lead.phone} type="phone" enabled={maskLeads} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" /> Owner
                                </h4>
                                <p className="text-sm">{lead.sales_owner?.full_name || owners.find(o => o.value === lead.sales_owner_id)?.label || 'Unknown'}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Created Date
                                </h4>
                                <p className="text-sm">{format(new Date(lead.created_at), 'PPP p')}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                                    {lead.status?.replace(/_/g, ' ') || 'New'}
                                </div>
                            </div>
                            {lead.college && (
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building className="h-4 w-4" /> College
                                    </h4>
                                    <p className="text-sm">{lead.college}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Real Estate Details - Conditionally Rendered */}
                    {hasRealEstateData && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-primary/80 border-b pb-1">Real Estate Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {lead.property_name && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Home className="h-4 w-4" /> Property Interest
                                        </h4>
                                        <p className="text-sm">{lead.property_name}</p>
                                    </div>
                                )}
                                {lead.property_type && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Layers className="h-4 w-4" /> Type
                                        </h4>
                                        <p className="text-sm capitalize">{lead.property_type.replace(/_/g, ' ')}</p>
                                    </div>
                                )}
                                {(lead.budget_min || lead.budget_max) && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" /> Budget
                                        </h4>
                                        <p className="text-sm">
                                            {lead.budget_min ? formatCurrency(lead.budget_min) : '0'} - {lead.budget_max ? formatCurrency(lead.budget_max) : 'Any'}
                                        </p>
                                    </div>
                                )}
                                {lead.preferred_location && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Location
                                        </h4>
                                        <p className="text-sm">{lead.preferred_location}</p>
                                    </div>
                                )}
                                {lead.possession_timeline && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <CalendarClock className="h-4 w-4" /> Possession
                                        </h4>
                                        <p className="text-sm">{lead.possession_timeline}</p>
                                    </div>
                                )}
                                {lead.purpose && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" /> Purpose
                                        </h4>
                                        <p className="text-sm capitalize">{lead.purpose}</p>
                                    </div>
                                )}
                                {lead.unit_number && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Home className="h-4 w-4" /> Unit No.
                                        </h4>
                                        <p className="text-sm">{lead.unit_number}</p>
                                    </div>
                                )}
                                {lead.deal_value && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" /> Deal Value
                                        </h4>
                                        <p className="text-sm">{formatCurrency(lead.deal_value)}</p>
                                    </div>
                                )}
                                {lead.broker_name && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" /> Broker
                                        </h4>
                                        <p className="text-sm">{lead.broker_name}</p>
                                    </div>
                                )}
                                {lead.site_visit_date && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" /> Site Visit
                                        </h4>
                                        <p className="text-sm">{format(new Date(lead.site_visit_date), 'PPP')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Marketing Data - Conditionally Rendered */}
                    {hasMarketingData && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-primary/80 border-b pb-1">Marketing Data</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {lead.lead_source && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> Source
                                        </h4>
                                        <p className="text-sm">{lead.lead_source}</p>
                                    </div>
                                )}
                                {lead.utm_source && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Megaphone className="h-4 w-4" /> UTM Source
                                        </h4>
                                        <p className="text-sm">{lead.utm_source}</p>
                                    </div>
                                )}
                                {lead.utm_medium && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Layers className="h-4 w-4" /> UTM Medium
                                        </h4>
                                        <p className="text-sm">{lead.utm_medium}</p>
                                    </div>
                                )}
                                {lead.utm_campaign && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Megaphone className="h-4 w-4" /> UTM Campaign
                                        </h4>
                                        <p className="text-sm">{lead.utm_campaign}</p>
                                    </div>
                                )}
                                {lead.ca_name && !lead.utm_source && (
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" /> CA / Source
                                        </h4>
                                        <p className="text-sm">{lead.ca_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(lead.product_purchased || (lead as any).product_category) && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-primary/80 border-b pb-1">Product Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-sm">
                                    <p><span className="text-muted-foreground">Category:</span> {(lead as any).product_category || 'N/A'}</p>
                                    <p><span className="text-muted-foreground">Product:</span> {lead.product_purchased || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Link className="h-4 w-4" /> Payment Link
                                    </h4>
                                    <p className="text-sm truncate max-w-[200px]" title={lead.payment_link || ''}>
                                        {lead.payment_link ? (
                                            <a href={lead.payment_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                View Link
                                            </a>
                                        ) : 'Not generated'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {pendingStatus && (
                <StatusReminderDialog
                    open={statusReminderOpen}
                    onOpenChange={setStatusReminderOpen}
                    status={pendingStatus}
                    onConfirm={handleReminderConfirm}
                    onCancel={handleReminderCancel}
                />
            )}
        </Dialog>
    );
}
