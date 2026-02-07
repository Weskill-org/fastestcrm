import { memo } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MoreHorizontal, ChevronDown } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateLead } from '@/hooks/useLeads';
import { CompanyLeadStatus } from '@/hooks/useLeadStatuses';
import { Product } from '@/hooks/useProducts';

// Define Lead type locally as it is not exported from useLeads
export type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
};

interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  products: Product[];
  productCategories: string[];
  statuses: CompanyLeadStatus[];
  owners: { label: string; value: string }[];
  getStatusColor: (value: string) => string;
}

const LeadRow = memo(({
  lead,
  isSelected,
  onSelect,
  onViewDetails,
  onEdit,
  products,
  productCategories,
  statuses,
  owners,
  getStatusColor,
}: LeadRowProps) => {
  const updateLead = useUpdateLead();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        status: newStatus
      });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProductChange = async (productName: string) => {
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
        id: lead.id,
        product_category: product.category,
        product_purchased: product.name
      });
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!lead.product_purchased) {
      toast.error('Please select a specific product to create a payment link');
      return;
    }

    // Match by name. Ideally we should match by ID if we stored product_id
    const selectedProgram = products?.find(p => p.name === lead.product_purchased && (!lead.product_category || p.category === lead.product_category));

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
    } catch (error) {
      toast.dismiss();
      console.error('Payment Link Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create payment link';
      toast.error(message);
    }
  };

  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(lead.payment_link!);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <TableRow className="group">
      <TableCell>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={isSelected}
          onChange={onSelect}
        />
      </TableCell>
      <TableCell className="font-medium">{lead.name}</TableCell>
      <TableCell>
        {lead.email && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3 w-3" /> {lead.email}
          </span>
        )}
      </TableCell>
      <TableCell>
        {lead.phone && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" /> {lead.phone}
          </span>
        )}
      </TableCell>
      <TableCell>{lead.college || '-'}</TableCell>
      <TableCell>{lead.lead_source || '-'}</TableCell>
      <TableCell>
        <Select
          defaultValue={lead.status}
          onValueChange={(value) => handleStatusChange(value)}
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
      </TableCell>
      <TableCell>
        {lead.sales_owner?.full_name || owners.find(o => o.value === lead.sales_owner_id)?.label || 'Unknown'}
      </TableCell>
      <TableCell>
        {format(new Date(lead.created_at), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] h-8 justify-between px-3 text-sm font-normal text-muted-foreground">
              <span className="truncate text-foreground">
                {lead.product_purchased
                  ? `${lead.product_category ? `${lead.product_category} - ` : ''}${lead.product_purchased}`
                  : "Select Product"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {productCategories.map(category => (
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
                        onClick={() => handleProductChange(product.name)}
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
      </TableCell>
      <TableCell>
        {lead.payment_link ? (
          <Button
            variant={lead.status === 'paid' ? 'default' : 'outline'}
            size="sm"
            className={`h-8 ${lead.status === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            onClick={copyPaymentLink}
          >
            {lead.status === 'paid' ? 'Paid' : 'Copy Link'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleCreatePaymentLink}
          >
            Create Link
          </Button>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onViewDetails(lead)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={lead.status} onValueChange={(value) => handleStatusChange(value)}>
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
            <DropdownMenuItem onClick={handleCreatePaymentLink}>
              Create Payment Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

LeadRow.displayName = 'LeadRow';

export { LeadRow };
