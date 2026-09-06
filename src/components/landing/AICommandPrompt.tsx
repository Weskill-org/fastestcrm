import { useState } from 'react';
import { Sparkles, ArrowRight, Bot, CheckCircle2, Zap, Terminal, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRESET_PROMPTS = [
  {
    label: "⚡ Autonomous Lead Routing",
    prompt: "Ingest incoming Meta leads, score intent >90%, and auto-dial within 5 seconds",
    logs: [
      "[0.04s] FastAI Webhook Ingestion: 48 incoming leads parsed",
      "[0.12s] FastAI Classifier: Intent scored at 96% (Budget ₹50L+)",
      "[0.18s] Priority Routing: Dispatched to Senior Telecaller & WhatsApp Demo sent",
      "[0.24s] Auto-Dialer Triggered: Connection active in 2.8s"
    ]
  },
  {
    label: "💰 1-Click WhatsApp Razorpay Deal",
    prompt: "Generate instant ₹1,50,000 payment link for Rajesh Mehta and auto-close lead upon payment",
    logs: [
      "[0.05s] Razorpay API: Dynamic payment link #RZP-984 created for ₹1,50,000",
      "[0.11s] WhatsApp Cloud API: Sent payment card to +91 98450 XXXXX",
      "[0.19s] Webhook Listener: Simulated payment capture verified (100% success)",
      "[0.25s] FastAI CRM Sync: Lead status updated to WON, CA commission credited"
    ]
  },
  {
    label: "🧠 FastAI Objection Copilot",
    prompt: "Analyze live telecaller conversation and suggest closing objection pitches for commercial real estate",
    logs: [
      "[0.03s] Voice Stream: Speech-to-text live transcription active",
      "[0.09s] Sentiment Analyzer: Detected buyer hesitation on Whitefield possession date",
      "[0.17s] FastAI Copilot: Recommended pitch: 'Highlight RERA certified completion & zero GST'",
      "[0.28s] Telecaller screen updated in real time"
    ]
  }
];

export function AICommandPrompt() {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedPrompt(idx);
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 text-left">
      <div className="glass-panel-3d rounded-2xl p-4 md:p-6 border border-emerald-500/30 shadow-2xl bg-gradient-to-b from-card/95 via-black/80 to-background/95 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                FastAI Autonomous Sales Copilot
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  ONLINE
                </span>
              </span>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Prompt the AI to run any revenue operation
          </span>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2 my-4">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={p.label}
              onClick={() => handleSelect(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedPrompt === idx
                  ? 'bg-primary text-slate-950 shadow-md font-bold'
                  : 'bg-white/[0.03] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Active Prompt Bar */}
        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3 mb-4">
          <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
          <span className="text-xs md:text-sm font-medium text-foreground/90 flex-1 truncate font-mono">
            {PRESET_PROMPTS[selectedPrompt].prompt}
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-primary font-bold px-2 py-1 rounded bg-primary/10 border border-primary/20 shrink-0">
            AUTONOMOUS EXECUTION
          </span>
        </div>

        {/* Real-time AI Execution Terminal Logs */}
        <div className="p-4 rounded-xl bg-black/80 border border-white/[0.06] font-mono text-[11px] md:text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-2 mb-2 border-b border-white/[0.06]">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-primary" /> Autonomous Execution Stream
            </span>
            <span className="text-emerald-400 font-bold">FastAI Latency: 0.28s</span>
          </div>

          {PRESET_PROMPTS[selectedPrompt].logs.map((log, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 transition-all ${
                isRunning ? 'opacity-40' : 'opacity-100'
              } text-foreground/85`}
            >
              <span className="text-emerald-400 shrink-0">✓</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AICommandPrompt;
