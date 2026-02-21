import React, { memo } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { TableCell, TableRow } from '@/components/ui/table';
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
import { CompanyLeadStatus } from '@/hooks/useLeadStatuses';

export type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
  lead_history?: any[] | null;
};

interface LeadRowProps {
  lead: Lead;
  visibleColumnIds: string[];
  columnDefinitions: Record<string, { label: string, render: (lead: Lead) => React.ReactNode }>;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (lead: Lead) => void;
  onViewHistory: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: string) => void;
  onCreatePaymentLink: (lead: Lead) => void;
  statuses: CompanyLeadStatus[];
}

export const LeadRow = memo(({
  lead,
  visibleColumnIds,
  columnDefinitions,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onViewHistory,
  onEdit,
  onStatusChange,
  onCreatePaymentLink,
  statuses
}: LeadRowProps) => {
  return (
    <TableRow className="group">
      <TableCell>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={isSelected}
          onChange={() => onToggleSelect(lead.id)}
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
            <DropdownMenuItem onClick={() => onViewDetails(lead)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewHistory(lead)}>
              View History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={lead.status} onValueChange={(value) => onStatusChange(lead.id, value)}>
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
            <DropdownMenuItem onClick={() => onCreatePaymentLink(lead)}>
              Create Payment Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

LeadRow.displayName = 'LeadRow';
