import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Megaphone, Plus, Trash2, Edit, Loader2, ToggleLeft, ToggleRight,
    Info, AlertTriangle, CheckCircle, Wrench, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type AnnType = 'info' | 'warning' | 'success' | 'maintenance';
type TargetType = 'all' | 'specific_companies' | 'subscription_status';

interface Announcement {
    id: string;
    title: string;
    body: string;
    type: AnnType;
    target_type: TargetType;
    target_company_ids: string[] | null;
    target_subscription_statuses: string[] | null;
    scheduled_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Company { id: string; name: string; subscription_status: string | null; }

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<AnnType, { label: string; icon: React.ElementType; classes: string }> = {
    info: { label: 'Info', icon: Info, classes: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
    warning: { label: 'Warning', icon: AlertTriangle, classes: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
    success: { label: 'Success', icon: CheckCircle, classes: 'border-green-500/30 text-green-400 bg-green-500/10' },
    maintenance: { label: 'Maintenance', icon: Wrench, classes: 'border-red-500/30 text-red-400 bg-red-500/10' },
};

const SUB_STATUSES = ['active', 'trialing', 'past_due', 'canceled'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const emptyForm = () => ({
    title: '',
    body: '',
    type: 'info' as AnnType,
    target_type: 'all' as TargetType,
    target_company_ids: [] as string[],
    target_subscription_statuses: [] as string[],
    scheduled_at: '',
    is_active: true,
});

function targetLabel(ann: Announcement) {
    if (ann.target_type === 'all') return 'All companies';
    if (ann.target_type === 'specific_companies')
        return `${ann.target_company_ids?.length || 0} companies`;
    return ann.target_subscription_statuses?.join(', ') || '—';
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AnnouncementsTab() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Announcement | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    // ── Fetch announcements ──
    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['platform-announcements'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'get_announcements' },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return (data?.announcements || []) as Announcement[];
        },
    });

    // ── Fetch companies for multi-select ──
    const { data: companies = [] } = useQuery({
        queryKey: ['platform-companies-list'],
        queryFn: async () => {
            const { data } = await supabase
                .from('companies')
                .select('id, name, subscription_status')
                .order('name');
            return (data || []) as Company[];
        },
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['platform-announcements'] });

    // ── Open dialog ──
    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm());
        setDialogOpen(true);
    };

    const openEdit = (ann: Announcement) => {
        setEditTarget(ann);
        setForm({
            title: ann.title,
            body: ann.body,
            type: ann.type,
            target_type: ann.target_type,
            target_company_ids: ann.target_company_ids || [],
            target_subscription_statuses: ann.target_subscription_statuses || [],
            scheduled_at: ann.scheduled_at ? ann.scheduled_at.slice(0, 16) : '',
            is_active: ann.is_active,
        });
        setDialogOpen(true);
    };

    // ── Save (create or update) ──
    const handleSave = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            toast({ title: 'Validation', description: 'Title and body are required', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const payload = editTarget
                ? {
                    action: 'update_announcement',
                    announcement_id: editTarget.id,
                    ...form,
                    scheduled_at: form.scheduled_at || null,
                }
                : {
                    action: 'create_announcement',
                    ...form,
                    scheduled_at: form.scheduled_at || null,
                };

            const { data, error } = await supabase.functions.invoke('admin-manage-company', { body: payload });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({ title: 'Success', description: data.message });
            setDialogOpen(false);
            invalidate();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle active ──
    const handleToggle = async (ann: Announcement) => {
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'toggle_announcement', announcement_id: ann.id, is_active: !ann.is_active },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toast({ title: 'Updated', description: data.message });
            invalidate();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    // ── Delete ──
    const handleDelete = async (ann: Announcement) => {
        if (!confirm(`Delete announcement "${ann.title}"?`)) return;
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'delete_announcement', announcement_id: ann.id },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toast({ title: 'Deleted', description: data.message });
            invalidate();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    // ── Multi-select helpers ──
    const toggleCompany = (id: string) => {
        setForm(f => ({
            ...f,
            target_company_ids: f.target_company_ids.includes(id)
                ? f.target_company_ids.filter(x => x !== id)
                : [...f.target_company_ids, id],
        }));
    };

    const toggleStatus = (s: string) => {
        setForm(f => ({
            ...f,
            target_subscription_statuses: f.target_subscription_statuses.includes(s)
                ? f.target_subscription_statuses.filter(x => x !== s)
                : [...f.target_subscription_statuses, s],
        }));
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        Announcements
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Broadcast in-app messages to all or specific companies
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Announcement
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcements.map(ann => {
                                    const meta = TYPE_META[ann.type] || TYPE_META.info;
                                    const Icon = meta.icon;
                                    const isLive = ann.is_active && (!ann.scheduled_at || new Date(ann.scheduled_at) <= new Date());
                                    return (
                                        <TableRow key={ann.id}>
                                            <TableCell>
                                                <div className="font-medium">{ann.title}</div>
                                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{ann.body}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`gap-1 ${meta.classes}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {meta.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm capitalize">{targetLabel(ann)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {ann.scheduled_at ? (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(ann.scheduled_at).toLocaleString('en-IN', {
                                                            dateStyle: 'medium', timeStyle: 'short'
                                                        })}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400 text-xs">Immediately</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={isLive
                                                        ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                                        : 'border-muted-foreground/30 text-muted-foreground'}
                                                >
                                                    {isLive ? 'Live' : ann.is_active ? 'Scheduled' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggle(ann)}
                                                        title={ann.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {ann.is_active
                                                            ? <ToggleRight className="h-4 w-4 text-green-400" />
                                                            : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                                        }
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(ann)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(ann)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {announcements.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No announcements yet. Create your first one!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
                        <DialogDescription>
                            {editTarget ? 'Update this announcement.' : 'This will be shown as a banner to targeted company users.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g. Scheduled Maintenance on Feb 25"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </div>

                        {/* Body */}
                        <div className="space-y-1.5">
                            <Label>Message</Label>
                            <Textarea
                                placeholder="Full announcement message..."
                                rows={3}
                                value={form.body}
                                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AnnType }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.entries(TYPE_META) as [AnnType, typeof TYPE_META[AnnType]][]).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>
                                            <span className="flex items-center gap-2">
                                                <v.icon className="h-4 w-4" />
                                                {v.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Target Type */}
                        <div className="space-y-1.5">
                            <Label>Target Audience</Label>
                            <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v as TargetType }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Companies</SelectItem>
                                    <SelectItem value="specific_companies">Specific Companies</SelectItem>
                                    <SelectItem value="subscription_status">By Subscription Status</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Specific companies multi-select */}
                        {form.target_type === 'specific_companies' && (
                            <div className="space-y-1.5">
                                <Label>Select Companies ({form.target_company_ids.length} selected)</Label>
                                <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                                    {companies.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => toggleCompany(c.id)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${form.target_company_ids.includes(c.id)
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'hover:bg-muted text-foreground'
                                                }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${form.target_company_ids.includes(c.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                }`}>
                                                {form.target_company_ids.includes(c.id) && (
                                                    <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                                                )}
                                            </span>
                                            <span className="flex-1 truncate">{c.name}</span>
                                            {c.subscription_status && (
                                                <span className="text-xs text-muted-foreground">{c.subscription_status}</span>
                                            )}
                                        </button>
                                    ))}
                                    {companies.length === 0 && (
                                        <p className="text-xs text-muted-foreground p-2">No companies found</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Subscription status multi-select */}
                        {form.target_type === 'subscription_status' && (
                            <div className="space-y-1.5">
                                <Label>Subscription Statuses</Label>
                                <div className="flex flex-wrap gap-2">
                                    {SUB_STATUSES.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleStatus(s)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors capitalize ${form.target_subscription_statuses.includes(s)
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50'
                                                }`}
                                        >
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scheduled At */}
                        <div className="space-y-1.5">
                            <Label>Go Live At <span className="text-muted-foreground font-normal">(leave empty = immediately)</span></Label>
                            <Input
                                type="datetime-local"
                                value={form.scheduled_at}
                                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editTarget ? 'Save Changes' : 'Create Announcement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
