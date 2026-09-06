import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, PhoneCall, Bot, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AIAgentHUD() {
  return (
    <div className="relative w-full max-w-5xl mx-auto my-6 pointer-events-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pointer-events-auto">
        {/* Agent 1: Autonomous Router */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="p-3.5 rounded-2xl glass-panel-3d border border-emerald-500/25 bg-black/40 backdrop-blur-xl shadow-lg relative group transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Agent: Router</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">300ms</span>
          </div>
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Instant Lead Ingestion</span>
          </p>
          <span className="text-[10px] text-muted-foreground/90 block mt-0.5">
            Auto-routes & triggers WhatsApp in &lt;1s
          </span>
        </motion.div>

        {/* Agent 2: FastAI Lead Qualifier */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="p-3.5 rounded-2xl glass-panel-3d border border-cyan-500/25 bg-black/40 backdrop-blur-xl shadow-lg relative group transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">Agent: FastAI Core</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">98% Acc</span>
          </div>
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Predictive Intent Score</span>
          </p>
          <span className="text-[10px] text-muted-foreground/90 block mt-0.5">
            Predicts deal size & close probability
          </span>
        </motion.div>

        {/* Agent 3: Voice AI Dialer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="p-3.5 rounded-2xl glass-panel-3d border border-indigo-500/25 bg-black/40 backdrop-blur-xl shadow-lg relative group transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Agent: AutoDial</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Live Voice</span>
          </div>
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <PhoneCall className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>AI Speech Transcription</span>
          </p>
          <span className="text-[10px] text-muted-foreground/90 block mt-0.5">
            Transcribes & logs notes with zero typing
          </span>
        </motion.div>

        {/* Agent 4: Autonomous Closer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="p-3.5 rounded-2xl glass-panel-3d border border-amber-500/25 bg-black/40 backdrop-blur-xl shadow-lg relative group transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">Agent: Closer</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">1-Click</span>
          </div>
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Razorpay Auto-Settlement</span>
          </p>
          <span className="text-[10px] text-muted-foreground/90 block mt-0.5">
            Dispatches payment links & splits CA cuts
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default AIAgentHUD;
