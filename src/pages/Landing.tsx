import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users, Phone, CreditCard, Workflow,
  Brain, ArrowRight, Zap, Target, TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Management',
    description: 'Track every lead from generation to conversion with smart status tracking and ownership assignment.'
  },
  {
    icon: Brain,
    title: 'AI Analytics (Gemini)',
    description: 'Get intelligent insights, conversion predictions, and AI-powered recommendations for every lead.'
  },
  {
    icon: Phone,
    title: 'Auto Dialer',
    description: 'Sequential calling with one click. Update status instantly after each call.'
  },
  {
    icon: Users,
    title: 'Team Hierarchy',
    description: '12-level hierarchy from CA to Company. Role-based access ensures data security.'
  },
  {
    icon: CreditCard,
    title: 'Payment Links',
    description: 'Razorpay integration for instant payment collection. Auto-update lead status on payment.'
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Rule-based triggers and actions. Automate follow-ups, notifications, and lead assignments.'
  }
];

const benefits = [
  { icon: Zap, text: 'Close deals faster with AI-prioritized leads' },
  { icon: Target, text: 'Automate follow-ups, never miss an opportunity' },
  { icon: TrendingUp, text: 'Track revenue in real-time from lead to payment' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/fastestcrmlogo.png" alt="Fastest CRM" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold">Fastest CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register-company">
              <Button size="sm" className="gradient-primary">
                Register Company
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              India's First AI-Powered CRM
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            The Fastest AI CRM for{' '}
            <span className="gradient-text block mt-2">Leads • Calls • Payments</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Automate your entire sales pipeline with the smartest CRM built for the Fastest teams.
            <span className="block mt-6 text-primary font-semibold text-lg md:text-xl bg-primary/10 py-2 px-4 rounded-full inline-block">
              Register now and get Free 1 seat. Startup Plan Starts as low as Rs.10/day/employee.
              <span className="block md:inline md:ml-2">If you can afford a tea, you can afford a CRM! ☕</span>
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full gradient-primary hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:shadow-primary/20">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                Live Demo
              </Button>
            </Link>
          </div>



        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="absolute top-0 right-0 -z-10 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full"></div>
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything You Need for the <span className="gradient-text">Fastest Growth</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From lead capture to payment collection, Fastest CRM handles your entire sales workflow with the fastest intelligent automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Cater To Section */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">Industries we serve</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for the <span className="gradient-text">Fastest Teams</span> across Industries
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: "Real Estate", icon: "🏢" },
              { name: "EdTech", icon: "🎓" },
              { name: "Training Institutes", icon: "📚" },
              { name: "Travel & Hospitality", icon: "✈️" },
              { name: "Finance & Loans", icon: "💰" },
              { name: "SaaS & B2B", icon: "💻" },
              { name: "Healthcare & Clinics", icon: "🏥" },
              { name: "Consultancy", icon: "🤝" }
            ].map((industry, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-6 rounded-xl bg-background border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group cursor-default">
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{industry.icon}</span>
                <span className="font-semibold text-foreground/80 group-hover:text-primary transition-colors">{industry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">
              Why Teams Love <span className="gradient-text">Fastest CRM</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.text}
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
                >
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-medium leading-relaxed">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section (New) */}
      <section className="py-20 px-6 border-y border-border/50 bg-background/50">
        <div className="container mx-auto text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholders for logos - replacing with text for now as we don't have logo assets */}
            <div className="text-xl font-bold text-muted-foreground hover:text-foreground transition-colors">TechCorp</div>
            <div className="text-xl font-bold text-muted-foreground hover:text-foreground transition-colors">GrowthLabs</div>
            <div className="text-xl font-bold text-muted-foreground hover:text-foreground transition-colors">ScaleUp</div>
            <div className="text-xl font-bold text-muted-foreground hover:text-foreground transition-colors">FutureSales</div>
            <div className="text-xl font-bold text-muted-foreground hover:text-foreground transition-colors">InnovateAI</div>
          </div>
        </div>
      </section>

      {/* FAQ Section (New) */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>

          <div className="space-y-4">
            {[
              { q: "Is there a free trial?", a: "Yes! You can start with a free trial to explore all features. No credit card required." },
              { q: "Can I import my existing leads?", a: "Absolutely. We support CSV imports and integrations with major platforms like Meta, Google, and more." },
              { q: "Is my data secure?", a: "Security is our top priority. We use enterprise-grade encryption and role-based access control to keep your data safe." },
              { q: "Do you offer support?", a: "Yes, we provide email and chat support to help you get the most out of Fastest CRM." }
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-lg hover:bg-muted/30 transition-colors">
                    <span>{faq.q}</span>
                    <span className="transition duration-300 group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <div className="text-muted-foreground p-6 pt-0 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-bottom-right z-0"></div>
        <div className="container mx-auto relative z-10">
          <div className="glass rounded-3xl p-6 md:p-12 text-center max-w-4xl mx-auto border-primary/20 hover:border-primary/40 transition-all duration-500 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">
              Ready to Transform Your Sales?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-xl mx-auto">
              Join thousands of sales teams closing more deals with Fastest CRM.
            </p>
            <Link to="/register-company">
              <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-full gradient-primary hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:shadow-primary/20 whitespace-normal">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              </Button>
            </Link>
            <p className="mt-6 text-xs md:text-sm text-muted-foreground px-4">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src="/fastestcrmlogo.png" alt="Fastest CRM" className="w-10 h-10 object-contain" />
              <div className="flex flex-col">
                <span className="font-bold text-lg">Fastest CRM</span>
                <span className="text-xs text-muted-foreground">AI-Powered Sales Automation</span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <Link to="/auth" className="hover:text-primary transition-colors">Login</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>

            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} Fastest CRM by Upmarking.com.<br />Built with ❤️ for Indian Sales Teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}