import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, Upload, Download } from 'lucide-react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsFilters } from '@/components/leads/LeadsFilters';
import { useLeads } from '@/hooks/useLeads';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AllLeads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: leads = [], isLoading } = useLeads({ search, statusFilter });

  return (
    <DashboardLayout>
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              All Leads
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : `${leads.length} total leads`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button className="gradient-primary gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <LeadsFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <LeadsTable leads={leads} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
