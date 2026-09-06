import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card3D } from './Card3D';
import { TrendingUp, Clock, Zap, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ROICalculator() {
  const [teamSize, setTeamSize] = useState<number>(5);
  const [avgDealSize, setAvgDealSize] = useState<number>(50000);

  // Calculations
  const hoursSavedPerMonth = teamSize * 22; // ~22 hours saved per rep per month
  const additionalDealsPerMonth = Math.max(1, Math.round(teamSize * 1.6));
  const additionalRevenuePerMonth = additionalDealsPerMonth * avgDealSize;
  const legacyCrmCostMonthly = teamSize * 6500; // ~₹6,500/rep for legacy CRM + add-on dialers
  const fastestCrmCostMonthly = teamSize * 999;
  const softwareSavingsMonthly = legacyCrmCostMonthly - fastestCrmCostMonthly;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 relative overflow-hidden" aria-labelledby="roi-heading">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Return on Investment
          </div>
          <h2
            id="roi-heading"
            className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight"
          >
            Calculate Your <span className="gradient-text">Revenue Acceleration</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            See the exact hours and extra pipeline unlocked with sub-second AI lead assignment and 1-click calling.
          </p>
        </div>

        <Card3D maxTilt={5} className="w-full">
          <div className="glass-panel-3d rounded-3xl p-6 md:p-10 border border-white/10 bg-gradient-to-b from-card/90 via-card/75 to-background/90 backdrop-blur-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders Column */}
              <div className="lg:col-span-6 space-y-8">
                {/* Slider 1: Team Size */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label htmlFor="team-size-slider" className="text-sm font-bold text-foreground">
                      Sales Team Size (Reps)
                    </label>
                    <span className="text-base font-extrabold text-primary font-mono bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                      {teamSize} {teamSize === 1 ? 'Rep' : 'Reps'}
                    </span>
                  </div>
                  <Slider
                    id="team-size-slider"
                    min={1}
                    max={50}
                    step={1}
                    value={[teamSize]}
                    onValueChange={(vals) => setTeamSize(vals[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                    <span>1 Rep</span>
                    <span>25 Reps</span>
                    <span>50 Reps</span>
                  </div>
                </div>

                {/* Slider 2: Average Deal Value */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label htmlFor="deal-value-slider" className="text-sm font-bold text-foreground">
                      Average Deal Value (₹)
                    </label>
                    <span className="text-base font-extrabold text-primary font-mono bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                      {formatCurrency(avgDealSize)}
                    </span>
                  </div>
                  <Slider
                    id="deal-value-slider"
                    min={10000}
                    max={500000}
                    step={5000}
                    value={[avgDealSize]}
                    onValueChange={(vals) => setAvgDealSize(vals[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                    <span>₹10,000</span>
                    <span>₹2,50,000</span>
                    <span>₹5,00,000</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-muted-foreground space-y-2">
                  <p className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span><strong className="text-foreground">10x Speed Advantage:</strong> Reaching leads in &lt;5 mins boosts connect rates by 21x.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span><strong className="text-foreground">Zero Manual Entry:</strong> Auto-logged call notes save 22 hours per rep every month.</span>
                  </p>
                </div>
              </div>

              {/* Output Metrics Column */}
              <div className="lg:col-span-6 bg-black/50 p-6 md:p-8 rounded-2xl border border-white/10 space-y-6">
                <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-mono">
                  <TrendingUp className="h-4 w-4" /> ESTIMATED MONTHLY IMPACT
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[11px] text-muted-foreground block mb-1">Time Reclaimed / Mo</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
                      {hoursSavedPerMonth} <span className="text-xs text-primary font-sans font-bold">hrs</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Directly for closing calls</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[11px] text-muted-foreground block mb-1">Software Cost Saved</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
                      {formatCurrency(softwareSavingsMonthly)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">vs Legacy CRM + Plugins</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30">
                  <span className="text-xs font-semibold text-foreground/80 block mb-1">
                    Estimated Extra Revenue Unlocked
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-primary font-mono block tracking-tight">
                    +{formatCurrency(additionalRevenuePerMonth)}
                    <span className="text-xs text-muted-foreground font-sans font-normal ml-1.5">/ month</span>
                  </span>
                  <span className="text-xs text-muted-foreground mt-1.5 block">
                    Based on +{additionalDealsPerMonth} additional deals won from instantaneous lead response.
                  </span>
                </div>

                <Link to="/register-company" className="block">
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl gradient-primary font-bold text-slate-950 shadow-lg hover:opacity-95 transition-opacity text-sm"
                  >
                    Start Free With 1 Seat Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card3D>
      </div>
    </section>
  );
}

export default ROICalculator;
