import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, PhoneCall, TrendingUp } from 'lucide-react';

interface DealEvent {
  id: string;
  icon: typeof Zap;
  color: string;
  title: string;
  timeAgo: string;
  industry: string;
}

const LIVE_EVENTS: DealEvent[] = [
  {
    id: '1',
    icon: TrendingUp,
    color: 'text-emerald-400',
    title: '₹1,85,000 Deal Closed via Auto-Dialer',
    timeAgo: '18s ago',
    industry: 'Real Estate · Bengaluru'
  },
  {
    id: '2',
    icon: Zap,
    color: 'text-primary',
    title: 'Lead Ingested & Dialed in 2.4s',
    timeAgo: '42s ago',
    industry: 'EdTech · Delhi NCR'
  },
  {
    id: '3',
    icon: CheckCircle2,
    color: 'text-cyan-400',
    title: '₹3,50,000 Razorpay Payment Captured',
    timeAgo: '1m ago',
    industry: 'SaaS B2B · Mumbai'
  },
  {
    id: '4',
    icon: PhoneCall,
    color: 'text-amber-400',
    title: '48 Sequential Calls Auto-Logged with AI Notes',
    timeAgo: '2m ago',
    industry: 'Finance & Loans · Hyderabad'
  }
];

export function LiveDealTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const event = LIVE_EVENTS[currentIndex];
  const Icon = event.icon;

  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-primary/25 shadow-lg max-w-full overflow-hidden transition-all duration-500">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>

      <Icon className={`h-4 w-4 ${event.color} shrink-0 animate-in fade-in zoom-in duration-300`} />

      <div className="flex items-center gap-2 overflow-hidden text-xs">
        <span className="font-semibold text-foreground truncate animate-in fade-in slide-in-from-right-4 duration-300">
          {event.title}
        </span>
        <span className="text-muted-foreground/70 hidden sm:inline">•</span>
        <span className="text-[11px] text-primary/90 hidden sm:inline shrink-0 font-medium">
          {event.industry}
        </span>
        <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">
          ({event.timeAgo})
        </span>
      </div>
    </div>
  );
}

export default LiveDealTicker;
