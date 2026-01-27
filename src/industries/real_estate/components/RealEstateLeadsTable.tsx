import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, MoreHorizontal, ChevronDown, MapPin, Calendar, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { RealEstateEditLeadDialog } from './RealEstateEditLeadDialog';
import { RealEstateLeadDetailsDialog } from './RealEstateLeadDetailsDialog';
import { SiteVisitDateTimeDialog } from './SiteVisitDateTimeDialog';
import { SiteVisitCameraDialog } from './SiteVisitCameraDialog';
import { useQueryClient } from '@tanstack/react-query';

export interface RealEstateLead {
  id: string;
  company_id: string | null;
  created_by_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  lead_source: string | null;
  pre_sales_owner_id: string | null;
  sales_owner_id: string | null;
  post_sales_owner_id: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  property_size: string | null;
  purpose: string | null;
  possession_timeline: string | null;
  broker_name: string | null;
  property_name: string | null;
  unit_number: string | null;
  deal_value: number | null;
  commission_percentage: number | null;
  commission_amount: number | null;
  lead_profile: Record<string, any>;
  notes: string | null;
  status: string;
  status_metadata: Record<string, any>;
  site_visit_photos: Array<{
    url: string;
    timestamp: string;
    lat: number;
    lng: number;
    verified: boolean;
  }>;
  revenue_projected: number | null;
  revenue_received: number | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  pre_sales_owner?: { full_name: string | null } | null;
  sales_owner?: { full_name: string | null } | null;
  post_sales_owner?: { full_name: string | null } | null;
}

interface RealEstateLeadsTableProps {
  leads: RealEstateLead[];
  loading: boolean;
  selectedLeads: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  owners?: { label: string; value: string }[];
  onRefetch: () => void;
}

export function RealEstateLeadsTable({ 
  leads, 
  loading, 
  selectedLeads, 
  onSelectionChange, 
  owners = [],
  onRefetch 
}: RealEstateLeadsTableProps) {
  const { statuses, getStatusColor } = useLeadStatuses();
  const [editingLead, setEditingLead] = useState<RealEstateLead | null>(null);
  const [viewingLead, setViewingLead] = useState<RealEstateLead | null>(null);
  const [siteVisitDialogLead, setSiteVisitDialogLead] = useState<RealEstateLead | null>(null);
  const [cameraDialogLead, setCameraDialogLead] = useState<RealEstateLead | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ leadId: string; status: string } | null>(null);
  const queryClient = useQueryClient();

  const handleStatusChange = async (leadId: string, newStatus: string, metadata?: Record<string, any>) => {
    // Check if status requires date/time input
    if ((newStatus === 'site_visit' || newStatus === 'request_callback') && !metadata) {
      setPendingStatus({ leadId, status: newStatus });
      setSiteVisitDialogLead(leads.find(l => l.id === leadId) || null);
      return;
    }

    try {
      const updateData: any = { status: newStatus };
      if (metadata) {
        updateData.status_metadata = metadata;
      }

      const { error } = await supabase
        .from('leads_real_estate')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
      
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['real-estate-leads'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSiteVisitConfirm = async (dateTime: Date) => {
    if (!pendingStatus || !siteVisitDialogLead) return;

    const metadata: Record<string, any> = {
      scheduled_at: dateTime.toISOString(),
    };

    if (pendingStatus.status === 'request_callback') {
      metadata.rcb_display = `RCB - ${format(dateTime, 'dd MMM yyyy, hh:mm a')}`;
    }

    await handleStatusChange(pendingStatus.leadId, pendingStatus.status, metadata);
    setSiteVisitDialogLead(null);
    setPendingStatus(null);
  };

  const getOwnerName = (ownerId: string | null, ownerObj?: { full_name: string | null } | null) => {
    if (ownerObj?.full_name) return ownerObj.full_name;
    if (!ownerId) return '-';
    return owners.find(o => o.value === ownerId)?.label || 'Unknown';
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return '-';
    const formatNum = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString()}`;
    };
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min) return `${formatNum(min)}+`;
    return `Up to ${formatNum(max!)}`;
  };

  const getStatusDisplay = (lead: RealEstateLead) => {
    const status = statuses.find(s => s.value === lead.status);
    const label = status?.label || lead.status;
    
    if (lead.status === 'request_callback' && lead.status_metadata?.rcb_display) {
      return lead.status_metadata.rcb_display;
    }
    
    if (lead.status === 'site_visit' && lead.status_metadata?.scheduled_at) {
      return `Site Visit - ${format(new Date(lead.status_metadata.scheduled_at), 'dd MMM, hh:mm a')}`;
    }
    
    return label;
  };

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
        <p>No leads found. Add your first real estate lead to get started!</p>
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
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Property Type</TableHead>
              <TableHead className="font-semibold">Budget</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Lead Profile</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Pre-Sales</TableHead>
              <TableHead className="font-semibold">Sales</TableHead>
              <TableHead className="font-semibold">Post-Sales</TableHead>
              <TableHead className="font-semibold">Notes</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{lead.property_type || '-'}</Badge>
                </TableCell>
                <TableCell>{formatBudget(lead.budget_min, lead.budget_max)}</TableCell>
                <TableCell>
                  {lead.preferred_location ? (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" /> {lead.preferred_location}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {lead.lead_profile && Object.keys(lead.lead_profile).length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {Object.values(lead.lead_profile).filter(Boolean).join(' > ')}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                  >
                    <SelectTrigger
                      className="w-[160px] h-8 text-white border-0 text-xs"
                      style={{ backgroundColor: getStatusColor(lead.status) }}
                    >
                      <SelectValue>{getStatusDisplay(lead)}</SelectValue>
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
                </TableCell>
                <TableCell className="text-sm">
                  {getOwnerName(lead.pre_sales_owner_id, lead.pre_sales_owner)}
                </TableCell>
                <TableCell className="text-sm">
                  {getOwnerName(lead.sales_owner_id, lead.sales_owner)}
                </TableCell>
                <TableCell className="text-sm">
                  {getOwnerName(lead.post_sales_owner_id, lead.post_sales_owner)}
                </TableCell>
                <TableCell>
                  {lead.notes ? (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs max-w-[100px] truncate" title={lead.notes}>
                      <FileText className="h-3 w-3" /> {lead.notes}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(lead.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {lead.status === 'site_visit' && (
                        <DropdownMenuItem onClick={() => setCameraDialogLead(lead)}>
                          📸 Capture Site Visit Photo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup 
                            value={lead.status} 
                            onValueChange={(value) => handleStatusChange(lead.id, value)}
                          >
                            {statuses.map((status) => (
                              <DropdownMenuRadioItem
                                key={status.id}
                                value={status.value}
                                className="capitalize"
                              >
                                {status.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RealEstateEditLeadDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        lead={editingLead}
        onSuccess={onRefetch}
      />

      <RealEstateLeadDetailsDialog
        open={!!viewingLead}
        onOpenChange={(open) => !open && setViewingLead(null)}
        lead={viewingLead}
        owners={owners}
      />

      <SiteVisitDateTimeDialog
        open={!!siteVisitDialogLead}
        onOpenChange={(open) => {
          if (!open) {
            setSiteVisitDialogLead(null);
            setPendingStatus(null);
          }
        }}
        statusType={pendingStatus?.status === 'request_callback' ? 'callback' : 'site_visit'}
        onConfirm={handleSiteVisitConfirm}
      />

      <SiteVisitCameraDialog
        open={!!cameraDialogLead}
        onOpenChange={(open) => !open && setCameraDialogLead(null)}
        lead={cameraDialogLead}
        onSuccess={onRefetch}
      />
    </>
  );
}
