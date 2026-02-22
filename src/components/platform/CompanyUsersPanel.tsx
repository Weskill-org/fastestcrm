import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    X, Trash2, KeyRound, AlertTriangle, Loader2, Users, GitBranch,
    Clock, ChevronRight, Copy, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompanyForPanel {
    id: string;
    name: string;
    slug: string;
}

interface CompanyUser {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    manager_id: string | null;
    manager_name: string | null;
    last_sign_in_at: string | null;
    created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
    company: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    company_subadmin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    cbo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    vp: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    avp: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    dgm: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    agm: 'bg-green-500/20 text-green-400 border-green-500/30',
    sm: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    tl: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    bde: 'bg-muted text-muted-foreground',
    intern: 'bg-muted text-muted-foreground',
    ca: 'bg-muted text-muted-foreground',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isInactive(lastSignIn: string | null) {
    if (!lastSignIn) return true;
    return Date.now() - new Date(lastSignIn).getTime() > THIRTY_DAYS_MS;
}

function formatLastSeen(lastSignIn: string | null) {
    if (!lastSignIn) return { label: 'Never', inactive: true };
    const diff = Date.now() - new Date(lastSignIn).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return { label: 'Today', inactive: false };
    if (days === 1) return { label: 'Yesterday', inactive: false };
    const inactive = days >= 30;
    return { label: `${days}d ago`, inactive };
}

// ── Hierarchy Tree ────────────────────────────────────────────────────────────

function HierarchyNode({ user, allUsers, depth = 0 }: {
    user: CompanyUser;
    allUsers: CompanyUser[];
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(depth < 2);
    const reports = allUsers.filter(u => u.manager_id === user.id);
    const { label: lastSeenLabel, inactive: lastSeenInactive } = formatLastSeen(user.last_sign_in_at);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                {reports.length > 0 && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                )}
                {reports.length === 0 && <span className="w-3.5 shrink-0" />}
                <span className="font-medium text-sm truncate">{user.full_name || user.email}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${ROLE_COLORS[user.role] || ''}`}>
                    {user.role}
                </Badge>
                <span className={`ml-auto text-xs shrink-0 ${lastSeenInactive ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {lastSeenLabel}
                </span>
            </div>
            {expanded && reports.map(report => (
                <HierarchyNode key={report.id} user={report} allUsers={allUsers} depth={depth + 1} />
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
    company: CompanyForPanel | null;
    onClose: () => void;
    onCompanyDeleted: () => void;
}

export function CompanyUsersPanel({ company, onClose, onCompanyDeleted }: Props) {
    const { toast } = useToast();
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');
    const [deletingCompany, setDeletingCompany] = useState(false);
    const [resetLink, setResetLink] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!company) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'get_company_users', company_id: company.id },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            setUsers(data.users || []);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [company, toast]);

    useEffect(() => {
        if (company) fetchUsers();
        else setUsers([]);
    }, [company, fetchUsers]);

    // ── Delete user ──
    const handleDeleteUser = async (user: CompanyUser) => {
        if (!confirm(`Delete user "${user.full_name || user.email}"? This is irreversible.`)) return;
        setProcessingId(user.id);
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'delete_company_user', user_id: user.id },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toast({ title: 'Deleted', description: data.message });
            setUsers(u => u.filter(x => x.id !== user.id));
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    // ── Force password reset ──
    const handleForceReset = async (user: CompanyUser) => {
        setProcessingId(user.id);
        setResetLink(null);
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'force_password_reset', user_email: user.email },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toast({ title: 'Reset link generated', description: `For ${user.email}` });
            if (data.link) setResetLink(data.link);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    const copyResetLink = () => {
        if (!resetLink) return;
        navigator.clipboard.writeText(resetLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // ── Delete company ──
    const handleDeleteCompany = async () => {
        if (deleteConfirmSlug !== company?.slug) {
            toast({ title: 'Slug mismatch', description: 'Type the company slug exactly to confirm', variant: 'destructive' });
            return;
        }
        setDeletingCompany(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'delete_company', company_id: company!.id },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            toast({ title: 'Company deleted', description: data.message });
            onCompanyDeleted();
            onClose();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setDeletingCompany(false);
        }
    };

    // ── Derived data ──
    const inactiveUsers = users.filter(u => isInactive(u.last_sign_in_at));
    const rootUsers = users.filter(u => !u.manager_id || !users.some(x => x.id === u.manager_id));

    // ── User row component ──
    const UserRow = ({ u }: { u: CompanyUser }) => {
        const { label: lastSeenLabel, inactive } = formatLastSeen(u.last_sign_in_at);
        return (
            <TableRow>
                <TableCell>
                    <div className="font-medium text-sm">{u.full_name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>
                        {u.role}
                    </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {u.manager_name || <span className="italic">— root</span>}
                </TableCell>
                <TableCell>
                    <span className={`text-xs font-medium flex items-center gap-1 ${inactive ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {inactive && <Clock className="h-3 w-3" />}
                        {lastSeenLabel}
                    </span>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleForceReset(u)}
                            disabled={!!processingId}
                            title="Force password reset"
                        >
                            {processingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteUser(u)}
                            disabled={!!processingId}
                            title="Delete user"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    if (!company) return null;

    return (
        <Dialog open={!!company} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div>
                            <DialogTitle className="text-lg">{company.name}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{company.slug}</code>
                                <span>·</span>
                                <span>{users.length} users</span>
                                {inactiveUsers.length > 0 && (
                                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-xs">
                                        {inactiveUsers.length} inactive
                                    </Badge>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Password reset link display */}
                {resetLink && (
                    <div className="mx-0 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2 text-sm shrink-0">
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-green-400 block mb-1">Reset link (one-time use):</span>
                            <span className="text-xs text-muted-foreground break-all font-mono">{resetLink}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={copyResetLink}>
                            {copiedLink ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                )}

                <Tabs defaultValue="users" className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <TabsList className="shrink-0">
                        <TabsTrigger value="users" className="gap-2">
                            <Users className="h-4 w-4" />
                            All Users ({users.length})
                        </TabsTrigger>
                        <TabsTrigger value="hierarchy" className="gap-2">
                            <GitBranch className="h-4 w-4" />
                            Hierarchy
                        </TabsTrigger>
                        <TabsTrigger value="inactive" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Inactive ({inactiveUsers.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ── All Users Tab ── */}
                    <TabsContent value="users" className="flex-1 overflow-auto min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Reports To</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(u => <UserRow key={u.id} u={u} />)}
                                    {users.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                No users found for this company
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>

                    {/* ── Hierarchy Tab ── */}
                    <TabsContent value="hierarchy" className="flex-1 overflow-auto min-h-0 p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : rootUsers.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">No users</div>
                        ) : (
                            <div className="space-y-0.5">
                                {rootUsers.map(u => (
                                    <HierarchyNode key={u.id} user={u} allUsers={users} depth={0} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Inactive Tab ── */}
                    <TabsContent value="inactive" className="flex-1 overflow-auto min-h-0">
                        {inactiveUsers.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground text-sm">
                                🎉 All users have logged in within the last 30 days
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Reports To</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inactiveUsers.map(u => <UserRow key={u.id} u={u} />)}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>

                {/* ── Danger Zone ── */}
                <div className="mt-2 pt-4 border-t border-red-500/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <span className="text-sm text-red-400 font-semibold">Danger Zone — Delete Company</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Input
                            placeholder={`Type "${company.slug}" to confirm`}
                            value={deleteConfirmSlug}
                            onChange={e => setDeleteConfirmSlug(e.target.value)}
                            className="max-w-xs border-red-500/30 text-sm"
                        />
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteCompany}
                            disabled={deletingCompany || deleteConfirmSlug !== company.slug}
                        >
                            {deletingCompany && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            Delete Company & All Users
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        This permanently deletes the company, all its users, wallet, and data. Cannot be undone.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
