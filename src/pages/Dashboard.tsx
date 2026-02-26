import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Users, Brain, TrendingUp, DollarSign, Target, BarChart3, CreditCard, Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// DashboardLayout removed
import { useLeads } from '@/hooks/useLeads';
import { format } from 'date-fns';

export default function Dashboard() {
  // Fetch all leads for accurate revenue calculations
  // TODO: Move aggregation to backend for better performance with large datasets
  const { data: leadsData, isLoading } = useLeads({
    fetchAll: true,
    // Optimize payload by only selecting fields needed for stats and recent leads list
    select: 'id, name, email, phone, status, revenue_received, revenue_projected, created_at, updated_at'
  });
  const leads = leadsData?.leads || [];

  // Calculate stats
  const today = new Date();
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const leadsToday = leads.filter(lead => isToday(lead.updated_at));
  const paidLeadsToday = leadsToday.filter(lead => lead.status === 'paid');

  const revenueToday = leadsToday.reduce((sum, lead) => sum + (Number(lead.revenue_received) || 0), 0);
  const totalRevenue = leads.reduce((sum, lead) => sum + (Number(lead.revenue_received) || 0), 0);
  const projectedRevenue = leads
    .filter(lead => lead.status === 'paid')
    .reduce((sum, lead) => sum + (Number(lead.revenue_projected) || 0), 0);
  const pipelineValue = leads
    .filter(lead => ['interested', 'follow_up'].includes(lead.status))
    .reduce((sum, lead) => sum + (Number(lead.revenue_projected) || 0), 0);

  const stats = [
    {
      label: 'Daily Sales',
      value: paidLeadsToday.length.toString(),
      icon: Target,
      trend: 'Today'
    },
    {
      label: 'Revenue Today',
      value: `₹${revenueToday.toLocaleString()}`,
      icon: DollarSign,
      trend: 'Today'
    },
    {
      label: 'Projected Revenue',
      value: `₹${projectedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      trend: 'Total'
    },
    {
      label: 'Lifetime Payments',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      trend: 'Total'
    },
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      trend: 'Total'
    },
    {
      label: 'Pipeline Value',
      value: `₹${pipelineValue.toLocaleString()}`,
      icon: Brain,
      trend: 'Forecast'
    },
  ];

  const recentLeads = leads.slice(0, 5);

  return (
    <>
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border px-6 md:px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back! Here's your sales overview.</p>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {(isLoading ? Array(6).fill({}) : stats).map((stat, i) => {
            const accentColors = [
              'border-l-amber-400', 'border-l-emerald-400', 'border-l-primary', 'border-l-teal-400', 'border-l-blue-400', 'border-l-violet-400'
            ];
            const iconColors = [
              'text-amber-400', 'text-emerald-400', 'text-primary', 'text-teal-400', 'text-blue-400', 'text-violet-400'
            ];
            const bgColors = [
              'bg-amber-400/10', 'bg-emerald-400/10', 'bg-primary/10', 'bg-teal-400/10', 'bg-blue-400/10', 'bg-violet-400/10'
            ];
            return (
              <Card key={stat.label || i} className={`glass card-hover border-l-2 ${accentColors[i % accentColors.length]}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${bgColors[i % bgColors.length]} flex items-center justify-center`}>
                      {isLoading ? (
                        <Skeleton className="h-5 w-5" />
                      ) : (
                        <stat.icon className={`h-5 w-5 ${iconColors[i % iconColors.length]}`} />
                      )}
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-3 w-12" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.trend}</span>
                    )}
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mb-2" />
                  ) : (
                    <p className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.value}</p>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Your latest lead activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-3 w-24 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLeads.length > 0 ? (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-primary/4 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ color: 'hsl(222 28% 5%)' }}>
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email || lead.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1 ${lead.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' :
                            lead.status === 'interested' ? 'bg-primary/15 text-primary' :
                              lead.status === 'follow_up' ? 'bg-amber-500/15 text-amber-400' :
                                lead.status === 'dropped' ? 'bg-red-500/15 text-red-400' :
                                  'bg-muted text-muted-foreground'
                          }`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(lead.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads yet. Add your first lead to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Brain className="h-4 w-4" style={{ color: 'hsl(222 28% 5%)' }} />
                </div>
                <div>
                  <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>AI Insights</CardTitle>
                  <CardDescription className="text-xs">Powered by Gemini</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ) : leads.length > 0 ? (
                  <p className="text-sm">
                    You have {leads.length} leads.
                    {pipelineValue > 0 && ` Potential pipeline value of ₹${pipelineValue.toLocaleString()}.`}
                    <br />Keep following up!
                  </p>
                ) : (
                  <p className="text-sm">Add leads to unlock AI-powered insights and recommendations.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
