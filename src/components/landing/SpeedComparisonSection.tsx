import { Card3D } from './Card3D';
import { Check, X, Zap, Sparkles } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'Lead Delivery & Response Speed',
    fastest: '3.2 seconds (Instant auto-route)',
    traditional: '48 minutes average',
    highlight: true
  },
  {
    feature: 'Built-in Auto-Dialer & Audio Logging',
    fastest: 'Native 1-Click with AI Speech Notes',
    traditional: 'Expensive 3rd-party add-ons ($40/mo)'
  },
  {
    feature: '12-Level CA & Partner Hierarchy',
    fastest: 'Built-in Multi-tier Commission Lock',
    traditional: 'Requires $20,000+ custom Salesforce dev'
  },
  {
    feature: 'Instant WhatsApp & Razorpay Links',
    fastest: '1-Click payment capture + auto-close',
    traditional: 'Manual PDF invoice generation'
  },
  {
    feature: 'Setup & Onboarding Time',
    fastest: '3 Minutes (Self-serve no-code setup)',
    traditional: '4 to 8 weeks complex deployment'
  },
  {
    feature: 'Starting Price / User / Month',
    fastest: '₹999/mo (Free 1-Seat Starter)',
    traditional: '₹6,500 - ₹12,000/mo + add-ons',
    highlight: true
  }
];

export function SpeedComparisonSection() {
  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 relative overflow-hidden" aria-labelledby="comparison-heading">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-3 font-mono">
            <Sparkles className="h-3.5 w-3.5" /> Performance Benchmark
          </div>
          <h2
            id="comparison-heading"
            className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight"
          >
            Built for <span className="gradient-text">Pure Speed</span>, Not Bloat
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto px-2">
            Legacy CRMs were architected in 2005 for administrative reporting. FastestCRM is designed for modern, high-velocity revenue closers.
          </p>
        </div>

        {/* ── Desktop View (Full Responsive Table) ── */}
        <div className="hidden md:block">
          <Card3D maxTilt={4} className="w-full">
            <div className="glass-panel-3d rounded-3xl p-6 lg:p-8 border border-white/10 bg-gradient-to-b from-card/90 via-card/75 to-background/90 backdrop-blur-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-2/5">
                      Feature & Capability
                    </th>
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-primary w-2/5 bg-primary/10 rounded-t-2xl border-t border-x border-primary/20">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span>FastestCRM (AI Engine)</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-1/5">
                      Traditional CRMs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs md:text-sm">
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.feature}
                      className={`hover:bg-white/[0.03] transition-colors ${row.highlight ? 'bg-primary/[0.04]' : ''}`}
                    >
                      <td className="py-4 px-5 font-semibold text-foreground">
                        {row.feature}
                      </td>
                      <td className="py-4 px-5 font-bold text-emerald-400 bg-primary/10 border-x border-primary/20">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{row.fastest}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-rose-400/80 shrink-0" />
                          <span>{row.traditional}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card3D>
        </div>

        {/* ── Mobile View (Stacked Responsive Cards) ── */}
        <div className="md:hidden space-y-3.5">
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.feature}
              className={`p-4 rounded-2xl glass-panel-3d border ${
                row.highlight ? 'border-primary/40 bg-primary/[0.03]' : 'border-white/10'
              } space-y-3`}
            >
              <h4 className="text-sm font-bold text-foreground tracking-tight">
                {row.feature}
              </h4>

              <div className="space-y-2 text-xs">
                {/* FastestCRM */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase block tracking-wider font-mono">
                      FastestCRM
                    </span>
                    <span className="font-bold text-emerald-300 block mt-0.5">
                      {row.fastest}
                    </span>
                  </div>
                </div>

                {/* Traditional */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-400/80 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider font-mono">
                      Traditional CRMs
                    </span>
                    <span className="text-muted-foreground block mt-0.5">
                      {row.traditional}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SpeedComparisonSection;
