import { useNavigate, useLocation, useSearchParams, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCompany } from '@/hooks/useCompany';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Users, UserCheck, CreditCard, Settings, LogOut, Phone, Workflow, Link2, BarChart3, Brain, Calendar, FileText, Building2, Shield, Package, PieChart, Database, CheckSquare, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

import { useTaskLeads } from '@/hooks/useTaskLeads';
import { useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import { NotificationsBell } from './NotificationsBell';
import { AnnouncementBanner } from './AnnouncementBanner';

const navItems = [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard'
}, {
    icon: BarChart3,
    label: 'LG Dashboard',
    path: '/dashboard/lg'
}, {
    icon: Users,
    label: 'All Leads',
    path: '/dashboard/leads'
}, {
    icon: UserCheck,
    label: 'Interested',
    path: '/dashboard/interested'
}, {
    icon: CreditCard,
    label: 'Paid',
    path: '/dashboard/paid'
}, {
    icon: Calendar,
    label: 'Pending Payments',
    path: '/dashboard/pending'
}, {
    icon: Phone,
    label: 'Auto Dialer',
    path: '/dashboard/dialer'
}, {
    icon: PieChart,
    label: 'Report',
    path: '/dashboard/report'
}, {
    icon: Brain,
    label: 'AI Insights',
    path: '/dashboard/ai'
}, {
    icon: FileText,
    label: 'Forms',
    path: '/dashboard/forms'
}, {
    icon: Users,
    label: 'Team',
    path: '/dashboard/team'
}, {
    icon: Workflow,
    label: 'Automations',
    path: '/dashboard/automations'
}, {
    icon: Link2,
    label: 'Integrations',
    path: '/dashboard/integrations'
}, {
    icon: Calendar,
    label: 'Calendar',
    path: '/dashboard/calendar'
}, {
    icon: Package,
    label: 'Products',
    path: '/dashboard/products',
    industryExclude: 'real_estate'
}, {
    icon: Building2,
    label: 'Properties',
    path: '/dashboard/properties',
    industryOnly: 'real_estate'
}, {
    icon: Users,
    label: 'Lead Profiling',
    path: '/dashboard/lead-profiling',
    industryOnly: 'real_estate'
}, {
    icon: Building2,
    label: 'Manage Company',
    path: '/dashboard/company'
}, {
    icon: Package,
    label: 'Statuses',
    path: '/dashboard/statuses'
}, {
    icon: Database,
    label: 'Bigdata SQL',
    path: '/dashboard/bigdata-sql',
    adminOnly: true
}, {
    icon: Settings,
    label: 'Settings',
    path: '/dashboard/settings'
}];

export default function AppLayout() {
    const {
        user,
        loading,
        signOut
    } = useAuth();
    const {
        data: role
    } = useUserRole();
    const {
        company,
        isCompanyAdmin
    } = useCompany();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    const [tasksExpanded, setTasksExpanded] = useState(location.pathname.startsWith('/dashboard/tasks'));

    const { urgent: urgentLeads, today: todayLeads, upcoming: upcomingLeads, isLoading: tasksLoading } = useTaskLeads();
    const taskCounts = { urgent: urgentLeads.length, today: todayLeads.length, upcoming: upcomingLeads.length };
    const totalTaskCount = taskCounts.urgent + taskCounts.today + taskCounts.upcoming;

    const isTasksActive = location.pathname.startsWith('/dashboard/tasks');
    const activeTaskTab = searchParams.get('tab') || 'today';

    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);

    const companyIndustry = (company as any)?.industry;
    const filteredNavItems = navItems.filter(item => {
        // Industry-specific filtering
        const industryOnly = (item as any).industryOnly;
        if (industryOnly) {
            if (Array.isArray(industryOnly)) {
                if (!industryOnly.includes(companyIndustry)) return false;
            } else if (industryOnly !== companyIndustry) return false;
        }
        const industryExclude = (item as any).industryExclude;
        if (industryExclude) {
            if (Array.isArray(industryExclude)) {
                if (industryExclude.includes(companyIndustry)) return false;
            } else if (industryExclude === companyIndustry) return false;
        }

        if (item.label === 'Integrations') {
            return role === 'company' || role === 'company_subadmin';
        }
        if (item.label === 'Products' || item.label === 'Properties') {
            return role === 'company' || role === 'company_subadmin' || isCompanyAdmin;
        }
        if (item.label === 'Lead Profiling') {
            return role === 'company' || role === 'company_subadmin' || isCompanyAdmin;
        }
        if (item.label === 'Manage Company') {
            return role === 'company' || role === 'company_subadmin' || isCompanyAdmin;
        }
        if (item.label === 'Statuses') {
            return role === 'company' || role === 'company_subadmin' || isCompanyAdmin;
        }
        if (item.label === 'Bigdata SQL') {
            return isCompanyAdmin;
        }
        return true;
    });

    if (loading) {
        return <div className="min-h-screen bg-background dark flex">
            {!isMobile && <div className="w-64 bg-sidebar border-r border-sidebar-border p-4">
                <Skeleton className="h-10 w-full mb-8" />
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)}
            </div>}
            <div className="flex-1 p-4 md:p-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        </div>;
    }

    if (!user) return null;

    return <div className="h-screen overflow-hidden bg-background dark flex">
        {/* Desktop Sidebar */}
        {!isMobile && <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
            <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    {company?.logo_url ? (
                        <img
                            src={company.logo_url}
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-foreground">
                                {company?.name?.[0] || 'Up'}
                            </span>
                        </div>
                    )}
                    <div>
                        <h1 className="font-semibold text-sidebar-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {company?.name || 'Fastest CRM'}
                        </h1>
                        <p className="text-xs text-muted-foreground">Fastest CRM by Upmarking.com</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationsBell />
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* Regular nav items — Dashboard + LG Dashboard first */}
                {filteredNavItems.slice(0, 2).map(item => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${location.pathname === item.path && !isTasksActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-[10px]'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent pl-[10px]'
                            }`}
                    >
                        <item.icon className={`h-4 w-4 transition-colors ${location.pathname === item.path && !isTasksActive ? 'text-primary' : ''}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                    </button>
                ))}

                {/* ── Tasks section (below LG Dashboard) ── */}
                <div>
                    <button
                        onClick={() => {
                            setTasksExpanded(prev => !prev);
                            if (!isTasksActive) navigate(`/dashboard/tasks?tab=${activeTaskTab}`);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${isTasksActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                    >
                        <CheckSquare className="h-4 w-4" />
                        <span className="flex-1 text-left">Tasks</span>
                        {!tasksLoading && totalTaskCount > 0 && (
                            <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                {totalTaskCount}
                            </span>
                        )}
                        {tasksExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </button>

                    {/* Sub-items */}
                    {tasksExpanded && (
                        <div className="mt-0.5 ml-3 border-l border-sidebar-border pl-3 space-y-0.5">
                            {/** Urgent */}
                            <button
                                onClick={() => navigate('/dashboard/tasks?tab=urgent')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${isTasksActive && activeTaskTab === 'urgent'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                    }`}
                            >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span className="flex-1 text-left">Urgent</span>
                                {!tasksLoading && taskCounts.urgent > 0 && (
                                    <span className="text-xs font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {taskCounts.urgent}
                                    </span>
                                )}
                            </button>

                            {/** Today */}
                            <button
                                onClick={() => navigate('/dashboard/tasks?tab=today')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${isTasksActive && activeTaskTab === 'today'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                    }`}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                <span className="flex-1 text-left">Today</span>
                                {!tasksLoading && taskCounts.today > 0 && (
                                    <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {taskCounts.today}
                                    </span>
                                )}
                            </button>

                            {/** Upcoming */}
                            <button
                                onClick={() => navigate('/dashboard/tasks?tab=upcoming')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${isTasksActive && activeTaskTab === 'upcoming'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                    }`}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="flex-1 text-left">Upcoming</span>
                                {!tasksLoading && taskCounts.upcoming > 0 && (
                                    <span className="text-xs font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {taskCounts.upcoming}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Remaining nav items (index 2+) */}
                {filteredNavItems.slice(2).map(item => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${location.pathname === item.path
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-[10px]'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent pl-[10px]'
                            }`}
                    >
                        <item.icon className={`h-4 w-4 transition-colors ${location.pathname === item.path ? 'text-primary' : ''}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.label === 'Bigdata SQL' && (
                            <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">New</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center ring-2 ring-primary/30">
                        <span className="text-sm font-bold" style={{ color: 'hsl(222 28% 5%)' }}>
                            {user.email?.[0].toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-sidebar-foreground">
                            {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </aside>}

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            <AnnouncementBanner />
            <div className="p-4 md:p-8 min-h-[calc(100vh-2rem)] flex flex-col">
                <div className="flex-1">
                    <Outlet />
                </div>
                <footer className="mt-auto pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground order-2 md:order-1">
                        © 2025-∞ Fastest CRM by Upmarking.com. Built for Fastest Sales Teams.
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4 order-1 md:order-2">
                        <p className="text-xs text-muted-foreground max-w-[200px] text-center md:text-right font-medium">
                            Download "FastestCRM App" for Seamless Experience
                        </p>
                        <a href="https://play.google.com/store/apps/details?id=com.fastestcrm" target="_blank" rel="noopener noreferrer">
                            <img src="/getitongoogleplay.png" alt="Get it on Google Play" className="h-8 hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                </footer>
            </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
    </div>;
}
