import { memo } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
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

// Duplicated from LeadsTable to avoid circular dependency
export type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
  lead_history?: any[] | null;
};

interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onToggle: (id: string) => void;
  visibleColumnIds: string[];
  columnDefinitions: Record<string, { label: string, render: (lead: Lead) => React.ReactNode }>;
  setViewingLead: (lead: Lead) => void;
  setViewingHistoryLead: (lead: Lead) => void;
  setEditingLead: (lead: Lead) => void;
  handleStatusChange: (leadId: string, newStatus: string) => void;
  handleCreatePaymentLink: (lead: Lead) => void;
  statuses: { id: string, value: string, label: string }[];
}

export const LeadRow = memo(({
  lead,
  isSelected,
  onToggle,
  visibleColumnIds,
  columnDefinitions,
  setViewingLead,
  setViewingHistoryLead,
  setEditingLead,
  handleStatusChange,
  handleCreatePaymentLink,
  statuses
}: LeadRowProps) => {
  return (
    <TableRow className="group">
      <TableCell>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={isSelected}
          onChange={() => onToggle(lead.id)}
        />
      </TableCell>

      {visibleColumnIds.map(colId => (
        <TableCell key={colId}>
          {columnDefinitions[colId]?.render(lead)}
        </TableCell>
      ))}

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
            <DropdownMenuItem onClick={() => setViewingHistoryLead(lead)}>
              View History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingLead(lead)}>
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
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
            <DropdownMenuItem onClick={() => handleCreatePaymentLink(lead)}>
              Create Payment Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

LeadRow.displayName = 'LeadRow';
