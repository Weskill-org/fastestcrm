
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { automationService, TriggerType, ActionType } from '@/services/automationService';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Automation Name</Label>
                        <Input
                            placeholder="e.g., Welcome Email for New Leads"
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
                                        <SelectItem value="status_changed">Lead Status Changed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

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
                                        {/* Future integration: WhatsApp, etc. */}
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
