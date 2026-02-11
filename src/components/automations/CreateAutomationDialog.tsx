
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import { automationService, TriggerType, ActionType } from '@/services/automationService';
import { useTeam } from '@/hooks/useTeam';
import { useForms } from '@/hooks/useForms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CreateAutomationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateAutomationDialog({ isOpen, onOpenChange, onSuccess }: CreateAutomationDialogProps) {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('lead_created');
    const [actionType, setActionType] = useState<ActionType>('send_email');
    const [loading, setLoading] = useState(false);

    // Trigger Config State
    const [triggerConfig, setTriggerConfig] = useState<any>({});

    // Action Config State
    const [actionConfig, setActionConfig] = useState<any>({});

    const { toast } = useToast();
    const { members } = useTeam();
    const { data: forms, isLoading: isLoadingForms } = useForms();

    // Reset config when action type changes
    useEffect(() => {
        setActionConfig({});
    }, [actionType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        // Validation for assign_lead
        if (actionType === 'assign_lead') {
            if (!actionConfig.distribution_logic) {
                toast({ title: 'Error', description: 'Please select a distribution logic', variant: 'destructive' });
                return;
            }
            if (!actionConfig.target_users || actionConfig.target_users.length === 0) {
                toast({ title: 'Error', description: 'Please select at least one user', variant: 'destructive' });
                return;
            }
        }

        setLoading(true);
        try {
            await automationService.createAutomation({
                name,
                trigger_type: triggerType,
                trigger_config: triggerConfig,
                action_type: actionType,
                action_config: actionConfig
            });

            toast({
                title: 'Success',
                description: 'Automation created successfully',
            });
            onSuccess();
            onOpenChange(false);
            setName('');
            setTriggerConfig({});
            setActionConfig({});
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        const currentUsers = actionConfig.target_users || [];
        let newUsers;
        if (currentUsers.includes(userId)) {
            newUsers = currentUsers.filter((id: string) => id !== userId);
        } else {
            newUsers = [...currentUsers, userId];
        }
        setActionConfig({ ...actionConfig, target_users: newUsers });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Automation Name</Label>
                        <Input
                            placeholder="Name your Workflow"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Trigger Section */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">When this happens...</h3>
                            <div className="space-y-2">
                                <Label>Trigger</Label>
                                <Select
                                    value={triggerType}
                                    onValueChange={(val) => setTriggerType(val as TriggerType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead_created">New Lead Created</SelectItem>
                                        <SelectItem value="form_submitted">New Form Submitted</SelectItem>
                                        <SelectItem value="status_changed">Lead Status Changed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {triggerType === 'form_submitted' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Form</Label>
                                        <Select
                                            value={triggerConfig.form_id || ''}
                                            onValueChange={(val) => setTriggerConfig({ ...triggerConfig, form_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a form" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isLoadingForms ? (
                                                    <SelectItem value="loading" disabled>Loading forms...</SelectItem>
                                                ) : (
                                                    forms?.map(form => (
                                                        <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex justify-between items-center">
                                            Conditions
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const currentConditions = triggerConfig.conditions || [];
                                                    setTriggerConfig({
                                                        ...triggerConfig,
                                                        conditions: [...currentConditions, { field: '', operator: 'equals', value: '' }]
                                                    });
                                                }}
                                            >
                                                + Add
                                            </Button>
                                        </Label>

                                        {triggerConfig.conditions?.map((idx: number, index: number) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Field (e.g. city)"
                                                    className="flex-1"
                                                    value={triggerConfig.conditions[index].field}
                                                    onChange={(e) => {
                                                        const newConditions = [...triggerConfig.conditions];
                                                        newConditions[index].field = e.target.value;
                                                        setTriggerConfig({ ...triggerConfig, conditions: newConditions });
                                                    }}
                                                />
                                                <Select
                                                    value={triggerConfig.conditions[index].operator}
                                                    onValueChange={(val) => {
                                                        const newConditions = [...triggerConfig.conditions];
                                                        newConditions[index].operator = val;
                                                        setTriggerConfig({ ...triggerConfig, conditions: newConditions });
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[110px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="equals">=</SelectItem>
                                                        <SelectItem value="not_equals">!=</SelectItem>
                                                        <SelectItem value="contains">contains</SelectItem>
                                                        <SelectItem value="greater_than">&gt;</SelectItem>
                                                        <SelectItem value="less_than">&lt;</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Value"
                                                    className="flex-1"
                                                    value={triggerConfig.conditions[index].value}
                                                    onChange={(e) => {
                                                        const newConditions = [...triggerConfig.conditions];
                                                        newConditions[index].value = e.target.value;
                                                        setTriggerConfig({ ...triggerConfig, conditions: newConditions });
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => {
                                                        const newConditions = triggerConfig.conditions.filter((_: any, i: number) => i !== index);
                                                        setTriggerConfig({ ...triggerConfig, conditions: newConditions });
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {triggerType === 'status_changed' && (
                                <div className="space-y-2">
                                    <Label>To Status</Label>
                                    <Select
                                        value={triggerConfig.to_status}
                                        onValueChange={(val) => setTriggerConfig({ ...triggerConfig, to_status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New">New</SelectItem>
                                            <SelectItem value="Contacted">Contacted</SelectItem>
                                            <SelectItem value="Qualified">Qualified</SelectItem>
                                            <SelectItem value="Won">Won</SelectItem>
                                            <SelectItem value="Lost">Lost</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">...Do this</h3>
                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Select
                                    value={actionType}
                                    onValueChange={(val) => setActionType(val as ActionType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="send_email">Send Email</SelectItem>
                                        <SelectItem value="webhook">Call Webhook</SelectItem>
                                        <SelectItem value="assign_lead">Assign Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {actionType === 'send_email' && (
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input
                                        placeholder="Email Subject"
                                        value={actionConfig.subject || ''}
                                        onChange={(e) => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                    />
                                    <Label>Message Body</Label>
                                    <Input
                                        placeholder="Hello {{name}}, ..."
                                        value={actionConfig.body || ''}
                                        onChange={(e) => setActionConfig({ ...actionConfig, body: e.target.value })}
                                    />
                                </div>
                            )}

                            {actionType === 'webhook' && (
                                <div className="space-y-2">
                                    <Label>Webhook URL</Label>
                                    <Input
                                        placeholder="https://api.example.com/webhook"
                                        value={actionConfig.url || ''}
                                        onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
                                    />
                                </div>
                            )}

                            {actionType === 'assign_lead' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Distribution Logic</Label>
                                        <Select
                                            value={actionConfig.distribution_logic || ''}
                                            onValueChange={(val) => setActionConfig({ ...actionConfig, distribution_logic: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Logic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="round_robin">Round Robin</SelectItem>
                                                <SelectItem value="random">Random</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Select Users</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between h-auto min-h-[40px]"
                                                >
                                                    <span className="truncate">
                                                        {actionConfig.target_users && actionConfig.target_users.length > 0
                                                            ? `${actionConfig.target_users.length} users selected`
                                                            : "Select users..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search users..." />
                                                    <CommandList>
                                                        <CommandEmpty>No user found.</CommandEmpty>
                                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                            {members.map((member) => (
                                                                <CommandItem
                                                                    key={member.id}
                                                                    value={member.full_name || member.email || member.id}
                                                                    onSelect={() => toggleUserSelection(member.id)}
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                            actionConfig.target_users?.includes(member.id)
                                                                                ? "bg-primary text-primary-foreground"
                                                                                : "opacity-50 [&_svg]:invisible"
                                                                        )}
                                                                    >
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <span>{member.full_name || member.email}</span>
                                                                    <Badge variant="secondary" className="ml-auto text-xs">
                                                                        {member.role}
                                                                    </Badge>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Selected users will receive leads based on the chosen logic.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Automation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
