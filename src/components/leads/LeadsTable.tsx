import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead } from '@/hooks/useLeads';
import { useProducts } from '@/hooks/useProducts';
import { useUserRole } from '@/hooks/useUserRole';

import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditLeadDialog } from './EditLeadDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { LeadHistoryDialog } from './LeadHistoryDialog';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { MaskedValue } from '@/components/ui/MaskedValue';
import { LeadRow, Lead } from './LeadRow';

interface ColumnConfigItem {
  id: string;
  visible: boolean;
}

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  selectedLeads: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  owners?: { label: string; value: string }[];
  columnConfig?: ColumnConfigItem[];
  maskLeads?: boolean;
}

export function LeadsTable({ leads, loading, selectedLeads, onSelectionChange, owners = [], columnConfig, maskLeads = false }: LeadsTableProps) {
  const { products } = useProducts();
  const updateLead = useUpdateLead();
  const { data: userRole } = useUserRole();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [viewingHistoryLead, setViewingHistoryLead] = useState<Lead | null>(null);
  const { statuses, getStatusColor } = useLeadStatuses();

  // Use ref to keep track of selectedLeads without triggering re-renders in useCallback
  const selectedLeadsRef = useRef(selectedLeads);
  useEffect(() => {
    selectedLeadsRef.current = selectedLeads;
  }, [selectedLeads]);

  const handleStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        status: newStatus as any
      });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  }, [updateLead]);

  const handleProductChange = useCallback(async (leadId: string, productName: string) => {
    // If clearing (if we support that)
    if (!productName || productName === 'none') {
      return;
    }

    const product = products?.find(p => p.name === productName);
    if (!product) {
      toast.error('Product not found in catalog');
      return;
    }

    try {
      await updateLead.mutateAsync({
        id: leadId,
        product_category: product.category,
        product_purchased: product.name
      });
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Failed to update product');
    }
  }, [products, updateLead]);

  const handleCreatePaymentLink = useCallback(async (lead: Lead) => {
    if (!lead.product_purchased) {
      toast.error('Please select a specific product to create a payment link');
      return;
    }

    // Match by name. Ideally we should match by ID if we stored product_id
    const selectedProgram = products?.find(p => p.name === lead.product_purchased && (!(lead as any).product_category || p.category === (lead as any).product_category));


    if (!selectedProgram) {
      toast.error('Program details not found');
      return;
    }

    // Convert price to paise (assuming price in DB is in INR)
    const amount = (selectedProgram.price || 0) * 100;


    if (amount <= 0) {
      toast.error('Program price must be greater than 0');
      return;
    }

    // Validation: Require either email or phone
    if (!lead.email && !lead.phone) {
      toast.error('Lead must have an email or phone number to create a payment link');
      return;
    }

    try {
      toast.loading('Creating payment link...');

      const payload = {
        amount,
        description: `Payment for ${lead.product_purchased}`,
        customer: {
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || ''
        },
        reference_id: lead.id
      };


      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: payload
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await updateLead.mutateAsync({
        id: lead.id,
        payment_link: data.short_url,
        revenue_projected: selectedProgram.price
      });

      toast.dismiss();
      toast.success('Payment link created successfully');
    } catch (error: any) {
      toast.dismiss();
      console.error('Payment Link Error:', error);
      toast.error(error.message || 'Failed to create payment link');
    }
  }, [products, updateLead]);

  // Define Column Renderers
  const columnDefinitions = useMemo(() => ({
    name: {
      label: 'Name',
      render: (lead: Lead) => <div className="font-medium">{lead.name}</div>
    },
    email: {
      label: 'Email',
      render: (lead: Lead) => lead.email ? (
        <span className="flex items-center gap-1 text-muted-foreground w-full">
          <Mail className="h-3 w-3 shrink-0" />
          <MaskedValue value={lead.email} type="email" enabled={maskLeads} showIcon={false} />
        </span>
      ) : null
    },
    phone: {
      label: 'Phone Number',
      render: (lead: Lead) => lead.phone ? (
        <span className="flex items-center gap-1 text-muted-foreground w-full">
          <Phone className="h-3 w-3 shrink-0" />
          <MaskedValue value={lead.phone} type="phone" enabled={maskLeads} showIcon={false} />
        </span>
      ) : null
    },
    college: {
      label: 'College',
      render: (lead: Lead) => lead.college || '-'
    },
    lead_source: {
      label: 'Lead Source',
      render: (lead: Lead) => lead.lead_source || '-'
    },
    status: {
      label: 'Status',
      render: (lead: Lead) => (
        <Select
          defaultValue={lead.status}
          onValueChange={(value) => handleStatusChange(lead.id, value)}
        >
          <SelectTrigger
            className="w-[140px] h-8 text-white border-0"
            style={{ backgroundColor: getStatusColor(lead.status) }}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem
                key={status.id}
                value={status.value}
                className="capitalize"
              >
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
    owner: {
      label: 'Owner',
      render: (lead: Lead) => lead.sales_owner?.full_name || owners.find(o => o.value === lead.sales_owner_id)?.label || 'Unknown'
    },
    created_at: {
      label: 'Date',
      render: (lead: Lead) => format(new Date(lead.created_at), 'MMM d, yyyy')
    },
    product_purchased: {
      label: 'Product',
      render: (lead: Lead) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] h-8 justify-between px-3 text-sm font-normal text-muted-foreground">
              <span className="truncate text-foreground">
                {lead.product_purchased
                  ? `${(lead as any).product_category ? `${(lead as any).product_category} - ` : ''}${lead.product_purchased}`
                  : "Select Product"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {Array.from(new Set((products || []).map(p => p.category))).sort().map(category => (
              <DropdownMenuSub key={category}>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  {category}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[200px]">
                  {products
                    ?.filter(p => p.category === category)
                    .map(product => (
                      <DropdownMenuItem
                        key={product.id}
                        onClick={() => handleProductChange(lead.id, product.name)}
                        className="cursor-pointer"
                      >
                        {product.name}
                      </DropdownMenuItem>
                    ))
                  }
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    payment_link: {
      label: 'Payment Link',
      render: (lead: Lead) => lead.payment_link ? (
        <Button
          variant={lead.status === 'paid' ? 'default' : 'outline'}
          size="sm"
          className={`h-8 ${lead.status === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(lead.payment_link!);
              toast.success('Link copied to clipboard');
            } catch (err) {
              console.error('Failed to copy:', err);
              toast.error('Failed to copy link');
            }
          }}
        >
          {lead.status === 'paid' ? 'Paid' : 'Copy Link'}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => handleCreatePaymentLink(lead)}
        >
          Create Link
        </Button>
      )
    },
    whatsapp: {
      label: 'WhatsApp',
      render: (lead: Lead) => lead.whatsapp ? (
        <a
          href={`https://wa.me/${lead.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-green-600 hover:text-green-700"
        >
          <Phone className="h-3 w-3" /> {lead.whatsapp}
        </a>
      ) : '-'
    },
    updated_at: {
      label: 'Last Updated',
      render: (lead: Lead) => format(new Date(lead.updated_at), 'MMM d, yyyy')
    },
    company_id: {
      label: 'Company ID',
      render: (lead: Lead) => <span className="text-xs text-muted-foreground">{lead.company_id || '-'}</span>
    }
  }), [maskLeads, owners, statuses, getStatusColor, products, handleStatusChange, handleProductChange, handleCreatePaymentLink]);

  const visibleColumnIds = useMemo(() => {
    if (!columnConfig) {
      // Default order
      return [
        'name',
        'email',
        'phone',
        'college',
        'lead_source',
        'status',
        'owner',
        'created_at',
        'product_purchased',
        'payment_link'
      ];
    }
    return columnConfig.filter(c => c.visible).map(c => c.id).filter(id => columnDefinitions[id as keyof typeof columnDefinitions]);
  }, [columnConfig, columnDefinitions]);


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

  // Stable toggle handler for row component
  const handleToggle = useCallback((id: string) => {
    const currentSelected = selectedLeadsRef.current;
    const newSelected = new Set(currentSelected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  }, [onSelectionChange]);

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
              {visibleColumnIds.map(colId => (
                <TableHead key={colId} className="font-semibold">
                  {columnDefinitions[colId as keyof typeof columnDefinitions]?.label}
                </TableHead>
              ))}
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onToggle={handleToggle}
                visibleColumnIds={visibleColumnIds}
                columnDefinitions={columnDefinitions}
                statuses={statuses}
                onViewDetails={setViewingLead}
                onViewHistory={setViewingHistoryLead}
                onEdit={setEditingLead}
                onStatusChange={handleStatusChange}
                onCreatePaymentLink={handleCreatePaymentLink}
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
        maskLeads={maskLeads}
      />

      <LeadHistoryDialog
        open={!!viewingHistoryLead}
        onOpenChange={(open) => !open && setViewingHistoryLead(null)}
        lead={viewingHistoryLead}
      />
    </>
  );
}
