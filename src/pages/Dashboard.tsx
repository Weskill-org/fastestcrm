import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, Users, UserCheck, CreditCard, Settings, 
  LogOut, Phone, Workflow, Link2, BarChart3, Brain,
  TrendingUp, DollarSign, Target, Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { label: 'Daily Sales', value: '0', icon: Target, trend: '+0%' },
  { label: 'Revenue Today', value: '₹0', icon: DollarSign, trend: '+0%' },
  { label: 'Projected Revenue', value: '₹0', icon: TrendingUp, trend: '+0%' },
  { label: 'Total Revenue', value: '₹0', icon: BarChart3, trend: '+0%' },
];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'LG Dashboard', path: '/dashboard/lg' },
  { icon: Users, label: 'All Leads', path: '/dashboard/leads' },
  { icon: UserCheck, label: 'Interested', path: '/dashboard/interested' },
  { icon: CreditCard, label: 'Paid', path: '/dashboard/paid' },
  { icon: Calendar, label: 'Pending Payments', path: '/dashboard/pending' },
  { icon: Phone, label: 'Auto Dialer', path: '/dashboard/dialer' },
  { icon: Brain, label: 'AI Insights', path: '/dashboard/ai' },
  { icon: Users, label: 'Team', path: '/dashboard/team' },
  { icon: Workflow, label: 'Automations', path: '/dashboard/automations' },
  { icon: Link2, label: 'Integrations', path: '/dashboard/integrations' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex">
        <div className="w-64 bg-sidebar border-r border-sidebar-border p-4">
          <Skeleton className="h-10 w-full mb-8" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">L³</span>
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Lead Cubed</h1>
              <p className="text-xs text-muted-foreground">AI-Powered CRM</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                location.pathname === item.path 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's your sales overview.</p>
            </div>
            <Button className="gradient-primary">
              <Users className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </header>
        
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-success font-medium">{stat.trend}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Your latest lead activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads yet. Add your first lead to get started!</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Insights
                </CardTitle>
                <CardDescription>Powered by Gemini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Add leads to unlock AI-powered insights and recommendations.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}