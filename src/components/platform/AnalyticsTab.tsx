import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    TrendingUp, Wallet, Users, Activity, AlertTriangle,
    Download, RefreshCw, Loader2, FileSpreadsheet,
} from 'lucide-react';
import Papa from 'papaparse';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPIs {
    estimatedMRR: number;
    activeSubscriptions: number;
    rechargeRevenueLast30d: number;
    leadsLast30d: number;
}

interface MRRPoint {
    month: string;      // "2025-03"
    newCompanies: number;
    activeCompanies: number;
    estimatedMRR: number;
}

interface WalletTopupPoint {
    month: string;
    totalRecharge: number;
    count: number;
}

interface LeadHeatmapPoint {
    week: string;
    companyId: string;
    companyName: string;
    count: number;
}

interface ChurnRiskCompany {
    id: string;
    name: string;
    slug: string;
    subscription_status: string | null;
    subscription_valid_until: string | null;
    used_licenses: number;
    total_licenses: number;
    wallet_balance: number;
    risks: string[];
}

interface AnalyticsData {
    kpis: KPIs;
    mrrTrend: MRRPoint[];
    walletTopupHistory: WalletTopupPoint[];
    leadHeatmapData: LeadHeatmapPoint[];
    churnRiskCompanies: ChurnRiskCompany[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (value: number) =>
    `₹${value.toLocaleString('en-IN')}`;

const shortMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const riskColor = (risk: string) => {
    if (risk.includes('Expiring')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (risk === 'Past Due') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (risk === 'No Active Users') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
};

/** Builds a stable 12-week × company grid from flat heatmap data */
function buildHeatmapGrid(data: LeadHeatmapPoint[]): {
    weeks: string[];
    companies: string[];
    grid: Record<string, Record<string, number>>;
    maxCount: number;
} {
    const weekSet = new Set<string>();
    const companySet = new Set<string>();
    const grid: Record<string, Record<string, number>> = {};
    let maxCount = 0;

    data.forEach(pt => {
        weekSet.add(pt.week);
        companySet.add(pt.companyName);
        if (!grid[pt.companyName]) grid[pt.companyName] = {};
        grid[pt.companyName][pt.week] = pt.count;
        if (pt.count > maxCount) maxCount = pt.count;
    });

    return {
        weeks: Array.from(weekSet).sort(),
        companies: Array.from(companySet).sort(),
        grid,
        maxCount,
    };
}

/** Heatmap cell opacity based on count vs max */
function heatOpacity(count: number, max: number): number {
    if (!count || !max) return 0;
    return Math.max(0.1, count / max);
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const MRRTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
            <p className="font-semibold mb-1">{shortMonth(label)}</p>
            <p className="text-primary">MRR: {formatINR(payload[0]?.value || 0)}</p>
            <p className="text-muted-foreground">Active: {payload[1]?.value || 0} companies</p>
        </div>
    );
};

const WalletTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
            <p className="font-semibold mb-1">{shortMonth(label)}</p>
            <p className="text-emerald-400">Recharges: {formatINR(payload[0]?.value || 0)}</p>
            <p className="text-muted-foreground">Transactions: {payload[1]?.value || 0}</p>
        </div>
    );
};

// ── Export helpers ────────────────────────────────────────────────────────────

function exportCSV(churnRisk: ChurnRiskCompany[], kpis: KPIs) {
    const rows = churnRisk.map(c => ({
        Company: c.name,
        Slug: c.slug,
        'Subscription Status': c.subscription_status || 'None',
        'Valid Until': c.subscription_valid_until
            ? new Date(c.subscription_valid_until).toLocaleDateString('en-IN')
            : 'N/A',
        'Licenses Used': c.used_licenses,
        'Total Licenses': c.total_licenses,
        'Wallet Balance (₹)': c.wallet_balance,
        'Risk Factors': c.risks.join('; '),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportExcel(churnRisk: ChurnRiskCompany[], kpis: KPIs, mrrTrend: MRRPoint[]) {
    // Build a simple HTML table that Excel can open natively
    const kpiHtml = `
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Estimated MRR</td><td>${formatINR(kpis.estimatedMRR)}</td></tr>
      <tr><td>Active Subscriptions</td><td>${kpis.activeSubscriptions}</td></tr>
      <tr><td>Recharge Revenue (last 30d)</td><td>${formatINR(kpis.rechargeRevenueLast30d)}</td></tr>
      <tr><td>Leads Created (last 30d)</td><td>${kpis.leadsLast30d}</td></tr>
    </table>
    <br/>
    <table>
      <tr><th>Month</th><th>Estimated MRR</th><th>Active Companies</th><th>New Companies</th></tr>
      ${mrrTrend.map(r => `<tr><td>${r.month}</td><td>${formatINR(r.estimatedMRR)}</td><td>${r.activeCompanies}</td><td>${r.newCompanies}</td></tr>`).join('')}
    </table>
    <br/>
    <table>
      <tr><th>Company</th><th>Slug</th><th>Status</th><th>Valid Until</th><th>Licenses Used</th><th>Total Licenses</th><th>Wallet (₹)</th><th>Risk Factors</th></tr>
      ${churnRisk.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.slug}</td>
          <td>${c.subscription_status || 'None'}</td>
          <td>${c.subscription_valid_until ? new Date(c.subscription_valid_until).toLocaleDateString('en-IN') : 'N/A'}</td>
          <td>${c.used_licenses}</td>
          <td>${c.total_licenses}</td>
          <td>${c.wallet_balance}</td>
          <td>${c.risks.join('; ')}</td>
        </tr>`).join('')}
    </table>
  `;

    const blob = new Blob(
        [`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'><head><meta charset='UTF-8'></head><body>${kpiHtml}</body></html>`],
        { type: 'application/vnd.ms-excel;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_report_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsTab() {
    const { toast } = useToast();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const { data: result, error } = await supabase.functions.invoke('admin-manage-company', {
                body: { action: 'get_analytics' },
            });
            if (error) throw error;
            if (result?.error) throw new Error(result.error);
            setData(result as AnalyticsData);
        } catch (err: any) {
            toast({
                title: 'Analytics Error',
                description: err.message || 'Failed to load analytics data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    const { kpis, mrrTrend, walletTopupHistory, leadHeatmapData, churnRiskCompanies } = data;
    const heatmap = buildHeatmapGrid(leadHeatmapData);

    // Format month labels for chart axes
    const mrrChartData = mrrTrend.map(d => ({ ...d, label: shortMonth(d.month) }));
    const walletChartData = walletTopupHistory.map(d => ({ ...d, label: shortMonth(d.month) }));

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Analytics & Reporting</h2>
                    <p className="text-sm text-muted-foreground">Platform-wide revenue, activity, and health metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportCSV(churnRiskCompanies, kpis)}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => exportExcel(churnRiskCompanies, kpis, mrrTrend)}
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/15">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. MRR</div>
                                <div className="text-2xl font-bold">{formatINR(kpis.estimatedMRR)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/15">
                                <Users className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Subs</div>
                                <div className="text-2xl font-bold">{kpis.activeSubscriptions}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/15">
                                <Wallet className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Recharge / 30d</div>
                                <div className="text-2xl font-bold">{formatINR(kpis.rechargeRevenueLast30d)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/15">
                                <Activity className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Leads / 30d</div>
                                <div className="text-2xl font-bold">{kpis.leadsLast30d.toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* MRR Trend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Monthly Recurring Revenue</CardTitle>
                        <CardDescription>Estimated MRR & active company count over last 12 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={mrrChartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="mrr"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="count"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<MRRTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Area
                                    yAxisId="mrr"
                                    type="monotone"
                                    dataKey="estimatedMRR"
                                    name="Est. MRR (₹)"
                                    stroke="hsl(var(--primary))"
                                    fill="url(#mrrGradient)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Area
                                    yAxisId="count"
                                    type="monotone"
                                    dataKey="activeCompanies"
                                    name="Active Companies"
                                    stroke="#22c55e"
                                    fill="url(#activeGradient)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Wallet Top-Up History */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Wallet Top-Up History</CardTitle>
                        <CardDescription>Total recharge volume & transaction count (last 6 months)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={walletChartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="amount"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="txn"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<WalletTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar
                                    yAxisId="amount"
                                    dataKey="totalRecharge"
                                    name="Total Recharge (₹)"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    yAxisId="txn"
                                    dataKey="count"
                                    name="# Transactions"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ── Lead Activity Heatmap ── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Lead Activity Heatmap</CardTitle>
                    <CardDescription>Leads created per company per week (last 12 weeks)</CardDescription>
                </CardHeader>
                <CardContent>
                    {heatmap.companies.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            No lead activity in the last 12 weeks
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div
                                className="grid gap-1 min-w-max"
                                style={{
                                    gridTemplateColumns: `160px repeat(${heatmap.weeks.length}, 32px)`,
                                }}
                            >
                                {/* Header row */}
                                <div />
                                {heatmap.weeks.map(week => (
                                    <div
                                        key={week}
                                        className="text-center text-[10px] text-muted-foreground leading-tight pb-1 select-none"
                                        title={week}
                                    >
                                        {week.split('-W')[1]}
                                    </div>
                                ))}

                                {/* Data rows */}
                                {heatmap.companies.map(company => (
                                    <>
                                        <div
                                            key={`label-${company}`}
                                            className="text-xs text-muted-foreground truncate pr-2 leading-8 select-none"
                                            title={company}
                                        >
                                            {company}
                                        </div>
                                        {heatmap.weeks.map(week => {
                                            const count = heatmap.grid[company]?.[week] || 0;
                                            const opacity = heatOpacity(count, heatmap.maxCount);
                                            return (
                                                <div
                                                    key={`${company}-${week}`}
                                                    title={count ? `${company} — ${week}: ${count} leads` : undefined}
                                                    className="w-8 h-8 rounded-sm transition-all duration-150 cursor-default flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: count
                                                            ? `rgba(99, 102, 241, ${opacity})`
                                                            : 'hsl(var(--muted))',
                                                    }}
                                                >
                                                    {count > 0 && (
                                                        <span className="text-[10px] font-medium text-white select-none leading-none">
                                                            {count > 99 ? '99+' : count}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">Less</span>
                                {[0, 0.1, 0.3, 0.6, 1].map(op => (
                                    <div
                                        key={op}
                                        className="w-4 h-4 rounded-sm"
                                        style={{
                                            backgroundColor: op === 0 ? 'hsl(var(--muted))' : `rgba(99, 102, 241, ${op})`,
                                        }}
                                    />
                                ))}
                                <span className="text-xs text-muted-foreground">More</span>
                                <span className="ml-auto text-xs text-muted-foreground">Max: {heatmap.maxCount} leads/week</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Churn Risk Table ── */}
            <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                Churn Risk Companies
                            </CardTitle>
                            <CardDescription>
                                Companies expiring soon, past due, with no active users, or no wallet activity in 60+ days
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                churnRiskCompanies.length > 0
                                    ? 'border-red-500/40 text-red-400'
                                    : 'border-green-500/40 text-green-400'
                            }
                        >
                            {churnRiskCompanies.length} at risk
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {churnRiskCompanies.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                            🎉 No churn risk companies detected
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {churnRiskCompanies.map(company => (
                                <div
                                    key={company.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm truncate">{company.name}</span>
                                            <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                {company.slug}
                                            </code>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>
                                                Licenses: {company.used_licenses}/{company.total_licenses}
                                            </span>
                                            <span>Wallet: {formatINR(company.wallet_balance)}</span>
                                            {company.subscription_valid_until && (
                                                <span>
                                                    Expires:{' '}
                                                    {new Date(company.subscription_valid_until).toLocaleDateString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 shrink-0">
                                        {company.risks.map(risk => (
                                            <Badge
                                                key={risk}
                                                variant="outline"
                                                className={`text-[11px] px-2 py-0.5 ${riskColor(risk)}`}
                                            >
                                                {risk}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
