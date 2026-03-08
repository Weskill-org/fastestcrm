import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Check, Loader2, ChevronLeft, ChevronRight, User, Mail, Phone, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isBefore, startOfDay, parseISO, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

type Step = 'date' | 'time' | 'details' | 'confirmed';

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [bookingPage, setBookingPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch booking page
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('booking_pages' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      if (err || !data) { setError('Booking page not found'); setLoading(false); return; }
      setBookingPage(data);
      setSelectedDuration((data as any).durations?.[0] || 30);
      setLoading(false);
    })();
  }, [slug]);

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Check if a day is available based on booking page config
  const isDayAvailable = (day: Date) => {
    if (isBefore(startOfDay(day), startOfDay(new Date()))) return false;
    if (!bookingPage?.availability) return false;
    const dayKey = DAY_KEYS[day.getDay()];
    return bookingPage.availability[dayKey]?.enabled || false;
  };

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !bookingPage?.availability) return [];
    const dayKey = DAY_KEYS[selectedDate.getDay()];
    const config = bookingPage.availability[dayKey];
    if (!config?.enabled) return [];

    const [startH, startM] = config.start.split(':').map(Number);
    const [endH, endM] = config.end.split(':').map(Number);
    const slots: string[] = [];
    const buffer = bookingPage.buffer_minutes || 0;

    let current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(endH, endM, 0, 0);

    while (addMinutes(current, selectedDuration) <= endTime) {
      // Skip past times for today
      if (isToday(selectedDate) && isBefore(current, new Date())) {
        current = addMinutes(current, selectedDuration + buffer);
        continue;
      }
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, selectedDuration + buffer);
    }
    return slots;
  }, [selectedDate, selectedDuration, bookingPage]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !name || !email || !bookingPage) return;
    setSubmitting(true);

    const [h, m] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addMinutes(startTime, selectedDuration);

    try {
      const { data, error: err } = await supabase.functions.invoke('create-booking', {
        body: {
          bookingPageId: bookingPage.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: selectedDuration,
          attendeeName: name,
          attendeeEmail: email,
          attendeePhone: phone,
          notes,
        },
      });

      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      setStep('confirmed');
    } catch (e: any) {
      setError(e.message || 'Failed to book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error && !bookingPage) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (step === 'confirmed') return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Meeting Confirmed!</h2>
          <p className="text-muted-foreground">Your meeting has been booked successfully.</p>
          <div className="bg-muted rounded-lg p-4 text-left space-y-2 text-sm">
            <p><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            <p><strong>Time:</strong> {selectedTime} ({selectedDuration} min)</p>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
          </div>
          <p className="text-xs text-muted-foreground">A calendar invite has been sent to your email.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center border-b border-border pb-4">
          <CardTitle className="text-xl">{bookingPage.title}</CardTitle>
          {bookingPage.description && <CardDescription>{bookingPage.description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-6">
          {error && <p className="text-sm text-destructive mb-4 text-center">{error}</p>}

          {/* Duration picker */}
          {bookingPage.durations?.length > 1 && step === 'date' && (
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {bookingPage.durations.map((d: number) => (
                <Button key={d} variant={selectedDuration === d ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDuration(d)}>
                  <Clock className="h-3 w-3 mr-1" /> {d} min
                </Button>
              ))}
            </div>
          )}

          {/* Step: Select Date */}
          {step === 'date' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-px">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const available = isDayAvailable(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={format(day, 'yyyy-MM-dd')}
                      onClick={() => { if (available) { setSelectedDate(day); setStep('time'); setSelectedTime(null); } }}
                      disabled={!available}
                      className={`p-2 h-12 text-sm rounded-lg transition-colors
                        ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}
                        ${!available ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/10'}
                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                        ${isToday(day) && !isSelected ? 'ring-1 ring-primary' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Select Time */}
          {step === 'time' && selectedDate && (
            <div>
              <Button variant="ghost" size="sm" className="mb-4" onClick={() => setStep('date')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <p className="text-sm font-medium mb-3">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')} — {selectedDuration} min
              </p>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No available slots for this day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {timeSlots.map(slot => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setSelectedTime(slot); setStep('details'); }}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Enter Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="mb-2" onClick={() => setStep('time')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {selectedDate && format(selectedDate, 'EEE, MMM d')} at {selectedTime} ({selectedDuration} min)
              </div>
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you'd like to discuss?" rows={3} />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !name || !email} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Confirm Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
