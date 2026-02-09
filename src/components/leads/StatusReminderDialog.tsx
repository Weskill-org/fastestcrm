import { useState, useEffect } from 'react';
import { format, addMinutes, addHours, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyLeadStatus } from '@/hooks/useLeadStatuses';

interface StatusReminderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    status: CompanyLeadStatus;
    onConfirm: (reminderAt: Date | null, sendNotification: boolean) => void;
    onCancel: () => void;
}

export function StatusReminderDialog({
    open,
    onOpenChange,
    status,
    onConfirm,
    onCancel,
}: StatusReminderDialogProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('10:00');
    const [sendNotification, setSendNotification] = useState(false);

    // Timer state for Time Derived
    const [timerValue, setTimerValue] = useState('15');
    const [timerUnit, setTimerUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');

    useEffect(() => {
        if (open) {
            // Default to tomorrow 10am for date derived
            const tomorrow = addDays(new Date(), 1);
            setDate(tomorrow);
            setTime('10:00');

            // Default to 15 mins for time derived
            setTimerValue('15');
            setTimerUnit('minutes');

            // Default notification to true if enabled in config
            setSendNotification(status.web_push_enabled);
        }
    }, [open, status]);

    const handleConfirm = () => {
        let reminderDate: Date | null = null;

        if (status.status_type === 'date_derived') {
            if (!date) return;
            const [hours, minutes] = time.split(':').map(Number);
            reminderDate = new Date(date);
            reminderDate.setHours(hours, minutes, 0, 0);
        } else if (status.status_type === 'time_derived') {
            const val = parseInt(timerValue);
            if (isNaN(val) || val <= 0) return;

            const now = new Date();
            if (timerUnit === 'minutes') reminderDate = addMinutes(now, val);
            if (timerUnit === 'hours') reminderDate = addHours(now, val);
            if (timerUnit === 'days') reminderDate = addDays(now, val);
        }

        onConfirm(reminderDate, sendNotification);
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            onCancel();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Reminder for "{status.label}"</DialogTitle>
                    <DialogDescription>
                        {status.status_type === 'date_derived'
                            ? 'Select a specific date and time for the reminder.'
                            : 'Set a countdown timer for the reminder.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {status.status_type === 'date_derived' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {status.status_type === 'time_derived' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Remind me in</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={timerValue}
                                        onChange={(e) => setTimerValue(e.target.value)}
                                        className="w-24"
                                    />
                                    <Select value={timerUnit} onValueChange={(val) => setTimerUnit(val as any)}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {status.web_push_enabled && (
                        <div className="flex items-center space-x-2 border-t pt-4 mt-2">
                            <Switch
                                id="notify"
                                checked={sendNotification}
                                onCheckedChange={setSendNotification}
                            />
                            <Label htmlFor="notify" className="flex items-center cursor-pointer">
                                <Bell className="h-4 w-4 mr-2" />
                                Send Web Push Notification
                            </Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleConfirm}>Set Reminder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
