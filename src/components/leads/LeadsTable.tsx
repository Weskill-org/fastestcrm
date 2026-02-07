import { useState, useMemo } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { useUserRole } from '@/hooks/useUserRole';
import { EditLeadDialog } from './EditLeadDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { LeadRow } from './LeadRow';

type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
};

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  selectedLeads: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  owners?: { label: string; value: string }[];
}

export function LeadsTable({ leads, loading, selectedLeads, onSelectionChange, owners = [] }: LeadsTableProps) {
  const { products } = useProducts();
  const { data: userRole } = useUserRole();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const { statuses, getStatusColor } = useLeadStatuses();

  const productCategories = useMemo(() => {
    return Array.from(new Set((products || []).map(p => p.category))).sort();
  }, [products]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No leads found. Add your first lead to get started!</p>
      </div>
    );
  }

  const allSelected = leads.length > 0 && leads.every((lead) => selectedLeads.has(lead.id));

  const toggleAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.delete(lead.id));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.add(lead.id));
      onSelectionChange(newSelected);
    }
  };

  const toggleOne = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone Number</TableHead>
              <TableHead className="font-semibold">College</TableHead>
              <TableHead className="font-semibold">Lead Source</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Owner</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Payment Link</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={() => toggleOne(lead.id)}
                onViewDetails={setViewingLead}
                onEdit={setEditingLead}
                products={products || []}
                productCategories={productCategories}
                statuses={statuses}
                owners={owners}
                getStatusColor={getStatusColor}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <EditLeadDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        lead={editingLead}
      />

      <LeadDetailsDialog
        open={!!viewingLead}
        onOpenChange={(open) => !open && setViewingLead(null)}
        lead={viewingLead}
        owners={owners}
      />
    </>
  );
}
