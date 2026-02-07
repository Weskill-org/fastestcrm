import { useState, useEffect } from 'react';
// DashboardLayout removed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Zap, ArrowRight, Mail, Phone, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { automationService, Automation } from '@/services/automationService';
import { CreateAutomationDialog } from '@/components/automations/CreateAutomationDialog';
import { useToast } from '@/hooks/use-toast';

export default function Automations() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { toast } = useToast();

    const fetchAutomations = async () => {
        try {
            const data = await automationService.getAutomations();
            setAutomations(data);
        } catch (error) {
            console.error('Failed to fetch automations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAutomations();
    }, []);

    const handleToggle = async (id: string, currentState: boolean) => {
        try {
            await automationService.toggleAutomation(id, currentState);
            setAutomations(automations.map(a =>
                a.id === id ? { ...a, is_active: !currentState } : a
            ));
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update automation status",
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await automationService.deleteAutomation(id);
            setAutomations(automations.filter(a => a.id !== id));
            toast({ title: "Deleted", description: "Automation deleted successfully" });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete automation",
                variant: 'destructive'
            });
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'send_email': return <Mail className="h-4 w-4" />;
            case 'webhook': return <Zap className="h-4 w-4" />;
            default: return <Workflow className="h-4 w-4" />;
        }
    };

    const formatConfig = (config: any) => {
        if (!config) return '';
        if (config.to_status) return `to ${config.to_status}`;
        if (config.url) return 'Webhook';
        if (config.subject) return config.subject;
        return '';
    };

    return (
        <>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Workflow Automations</h1>
                        <p className="text-muted-foreground">Automate repetitive tasks and scale your sales process.</p>
                    </div>
                    <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Automation
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {automations.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No automations yet. Create your first one!</p>
                            </div>
                        ) : (
                            automations.map((auto) => (
                                <Card key={auto.id} className="glass hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${auto.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                                                <Workflow className={`h-6 w-6 ${auto.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">{auto.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Badge variant="outline" className="bg-background flex items-center gap-1">
                                                        {auto.trigger_type.replace('_', ' ')}
                                                        <span className="text-xs opacity-70 ml-1">{formatConfig(auto.trigger_config)}</span>
                                                    </Badge>
                                                    <ArrowRight className="h-3 w-3" />
                                                    <Badge variant="outline" className="bg-background flex items-center gap-1">
                                                        {getIconForType(auto.action_type)}
                                                        {auto.action_type.replace('_', ' ')}
                                                        <span className="text-xs opacity-70 ml-1">{formatConfig(auto.action_config)}</span>
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-muted-foreground">{auto.is_active ? 'Active' : 'Paused'}</span>
                                            <Switch
                                                checked={auto.is_active}
                                                onCheckedChange={() => handleToggle(auto.id, auto.is_active)}
                                            />
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(auto.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                <CreateAutomationDialog
                    isOpen={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    onSuccess={fetchAutomations}
                />
            </div>
        </>
    );
}
