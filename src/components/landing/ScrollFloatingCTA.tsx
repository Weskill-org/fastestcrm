import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function ScrollFloatingCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 550);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl pointer-events-auto"
        >
          <div className="glass-strong rounded-2xl p-3 md:px-5 md:py-3.5 border border-primary/30 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(20,184,166,0.25)] flex items-center justify-between gap-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 hidden sm:flex">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-extrabold text-foreground tracking-tight flex items-center gap-1.5 truncate">
                  Ready to 10x your sales speed?
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Free 1-Seat Starter · Startup plan ₹999/mo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-xs font-semibold hover:text-primary h-9 px-3 rounded-xl hidden sm:inline-flex">
                  Demo
                </Button>
              </Link>
              <Link to="/register-company">
                <Button
                  size="sm"
                  className="gradient-primary font-bold text-slate-950 text-xs h-9 px-4 rounded-xl shadow-md hover:scale-[1.03] active:scale-[0.97] transition-transform"
                >
                  Register Free
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScrollFloatingCTA;
