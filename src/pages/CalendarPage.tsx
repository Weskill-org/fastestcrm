import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Link2, Clock, User, Loader2, Check, Copy, ExternalLink } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isToday, parseISO } from 'date-fns';
import { useCalendarConnection, useCalendarEvents, useBookingPage, useCreateBookingPage, useConnectGoogleCalendar, useExchangeCalendarCode } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [bookingSettingsOpen, setBookingSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const { data: connection, isLoading: connLoading } = useCalendarConnection();
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(monthStart, monthEnd);
  const { data: bookingPage, isLoading: bpLoading } = useBookingPage();
  const connectGoogle = useConnectGoogleCalendar();
  const exchangeCode = useExchangeCalendarCode();
  const saveBookingPage = useCreateBookingPage();

  // Lead reminders
  const { data: reminders = [] } = useLeadReminders(monthStart, monthEnd);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCode.mutate(code, {
        onSettled: () => {
          searchParams.delete('code');
          searchParams.delete('scope');
          setSearchParams(searchParams, { replace: true });
        }
      });
    }
  }, []);

  // Booking page form state
  const [bpTitle, setBpTitle] = useState('Book a Meeting');
  const [bpDesc, setBpDesc] = useState('');
  const [bpSlug, setBpSlug] = useState('');
  const [bpDurations, setBpDurations] = useState('15,30,60');
  const [bpBuffer, setBpBuffer] = useState(0);
  const [bpAvailability, setBpAvailability] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  });

  // Populate form when booking page loads
  useEffect(() => {
    if (bookingPage) {
      setBpTitle((bookingPage as any).title || 'Book a Meeting');
      setBpDesc((bookingPage as any).description || '');
      setBpSlug((bookingPage as any).slug || '');
      setBpDurations(((bookingPage as any).durations || [30]).join(','));
      setBpBuffer((bookingPage as any).buffer_minutes || 0);
      if ((bookingPage as any).availability) setBpAvailability((bookingPage as any).availability);
    } else if (user?.email) {
      setBpSlug(user.email.split('@')[0].replace(/[^a-z0-9-]/g, '-'));
    }
  }, [bookingPage, user]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateEvents = (events as any[]).filter((e: any) => isSameDay(parseISO(e.start_time), selectedDate));
    const dateReminders = (reminders as any[]).filter((r: any) => isSameDay(parseISO(r.reminder_at), selectedDate));
    return [
      ...dateEvents.map((e: any) => ({ ...e, type: 'event' })),
      ...dateReminders.map((r: any) => ({ id: r.id, title: `Follow-up: ${r.name}`, start_time: r.reminder_at, type: 'reminder', status: r.status })),
    ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [selectedDate, events, reminders]);

  // Check which days have events
  const daysWithEvents = useMemo(() => {
    const set = new Set<string>();
    (events as any[]).forEach((e: any) => set.add(format(parseISO(e.start_time), 'yyyy-MM-dd')));
    (reminders as any[]).forEach((r: any) => set.add(format(parseISO(r.reminder_at), 'yyyy-MM-dd')));
    return set;
  }, [events, reminders]);

  const handleSaveBookingPage = () => {
    const durations = bpDurations.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d > 0);
    if (durations.length === 0) { toast('Add at least one duration'); return; }
    if (!bpSlug.trim()) { toast('Set a booking URL slug'); return; }
    saveBookingPage.mutate({
      title: bpTitle,
      description: bpDesc,
      slug: bpSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      durations,
      availability: bpAvailability,
      bufferMinutes: bpBuffer,
    });
    setBookingSettingsOpen(false);
  };

  const bookingUrl = bookingPage ? `${window.location.origin}/book/${(bookingPage as any).slug}` : '';

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast('Booking link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage your meetings, follow-ups, and booking page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!connection ? (
            <Button onClick={() => connectGoogle.mutate()} disabled={connectGoogle.isPending}>
              {connectGoogle.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
              Connect Google Calendar
            </Button>
          ) : (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1 py-1.5">
              <Check className="h-3 w-3" /> Google Calendar Connected
            </Badge>
          )}
          <Dialog open={bookingSettingsOpen} onOpenChange={setBookingSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Link2 className="h-4 w-4 mr-2" /> Booking Settings</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Booking Page Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Page Title</Label>
                  <Input value={bpTitle} onChange={e => setBpTitle(e.target.value)} placeholder="Book a Meeting" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={bpDesc} onChange={e => setBpDesc(e.target.value)} placeholder="Schedule a call with me" />
                </div>
                <div>
                  <Label>Booking URL Slug</Label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    {window.location.origin}/book/<span className="font-mono text-foreground">{bpSlug || '...'}</span>
                  </div>
                  <Input value={bpSlug} onChange={e => setBpSlug(e.target.value)} placeholder="john-doe" />
                </div>
                <div>
                  <Label>Meeting Durations (comma-separated minutes)</Label>
                  <Input value={bpDurations} onChange={e => setBpDurations(e.target.value)} placeholder="15,30,60" />
                </div>
                <div>
                  <Label>Buffer Between Meetings (minutes)</Label>
                  <Input type="number" value={bpBuffer} onChange={e => setBpBuffer(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="mb-2 block">Weekly Availability</Label>
                  <div className="space-y-2">
                    {DAY_KEYS.map((day, i) => (
                      <div key={day} className="flex items-center gap-3">
                        <Switch
                          checked={bpAvailability[day]?.enabled}
                          onCheckedChange={c => setBpAvailability(prev => ({ ...prev, [day]: { ...prev[day], enabled: c } }))}
                        />
                        <span className="w-12 text-sm capitalize">{DAYS[i]}</span>
                        {bpAvailability[day]?.enabled && (
                          <>
                            <Input type="time" value={bpAvailability[day]?.start} onChange={e => setBpAvailability(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))} className="w-28 h-8" />
                            <span className="text-xs text-muted-foreground">to</span>
                            <Input type="time" value={bpAvailability[day]?.end} onChange={e => setBpAvailability(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))} className="w-28 h-8" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveBookingPage} disabled={saveBookingPage.isPending} className="w-full">
                  {saveBookingPage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Booking Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Booking link banner */}
      {bookingPage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Your Booking Link:</span>
              <code className="bg-background px-2 py-0.5 rounded text-xs">{bookingUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyBookingLink}>
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" /> Preview
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasEvent = daysWithEvents.has(dateKey);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-2 h-12 sm:h-16 text-sm rounded-lg transition-colors
                      ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                      ${isToday(day) && !isSelected ? 'ring-1 ring-primary' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {hasEvent && (
                      <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day detail sidebar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events on this day</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((evt: any) => (
                  <div key={evt.id} className={`p-3 rounded-lg border ${evt.type === 'reminder' ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'}`}>
                    <div className="flex items-start gap-2">
                      {evt.type === 'reminder' ? (
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                      ) : (
                        <CalendarIcon className="h-4 w-4 text-primary mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(evt.start_time), 'h:mm a')}
                          {evt.end_time && ` – ${format(parseISO(evt.end_time), 'h:mm a')}`}
                        </p>
                        {evt.attendee_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" /> {evt.attendee_name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {evt.type === 'reminder' ? 'Reminder' : evt.event_type === 'booking' ? 'Booking' : 'Event'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook to fetch lead reminders for calendar
function useLeadReminders(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-reminders-calendar', user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user?.id) return [];
      // Try generic leads table
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, reminder_at, status')
        .not('reminder_at', 'is', null)
        .gte('reminder_at', startDate.toISOString())
        .lte('reminder_at', endDate.toISOString())
        .order('reminder_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id,
  });
}
