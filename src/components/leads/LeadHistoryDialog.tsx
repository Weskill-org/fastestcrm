import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type LeadHistoryEntry = {
    action: string;
    details: string;
    timestamp: string;
    user_name: string;
    old_status?: string;
    new_status?: string;
};

type Lead = Tables<'leads'> & {
    lead_history?: LeadHistoryEntry[] | null;
};

interface LeadHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
}

export function LeadHistoryDialog({ open, onOpenChange, lead }: LeadHistoryDialogProps) {
    if (!lead) return null;

    // Sort history by timestamp descending (newest first)
    // Assuming the array might not be sorted, or just to be safe.
    // However, the DB trigger appends, so native order is oldest -> newest.
    // If we want newest first, we should reverse.
    const history = lead.lead_history
        ? [...lead.lead_history].reverse()
        : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Lead History
                    </DialogTitle>
                    <DialogDescription>
                        History of changes for {lead.name}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 p-1">
                        {history.length > 0 ? (
                            <div className="relative border-l border-muted ml-3 space-y-6">
                                {history.map((entry, index) => (
                                    <div key={index} className="relative pl-6">
                                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-primary bg-background ring-4 ring-background" />
                                        <div className="space-y-1">
                                            <p className="text-sm text-foreground/80">{entry.details}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), 'PPP p')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <p>No history available for this lead.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
