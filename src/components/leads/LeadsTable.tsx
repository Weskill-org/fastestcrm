import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Lead = Tables<'leads'>;

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  interested: 'bg-green-500/20 text-green-400 border-green-500/30',
  not_interested: 'bg-red-500/20 text-red-400 border-red-500/30',
  follow_up: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  rnr: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  dnd: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  interested: 'Interested',
  not_interested: 'Not Interested',
  follow_up: 'Follow Up',
  rnr: 'RNR',
  dnd: 'DND',
  paid: 'Paid',
};

export function LeadsTable({ leads, loading }: LeadsTableProps) {
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

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">College</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Revenue</TableHead>
            <TableHead className="font-semibold text-right">Projected</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="group">
              <TableCell>
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.domain || 'N/A'}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {lead.phone && (
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {lead.email && (
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {lead.phone || lead.email || 'No contact'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{lead.college || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.graduating_year ? `${lead.graduating_year}` : ''} {lead.branch || ''}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[lead.status] || ''}>
                  {statusLabels[lead.status] || lead.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                ₹{(lead.revenue_received || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                ₹{(lead.revenue_projected || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                    <DropdownMenuItem>Change Status</DropdownMenuItem>
                    <DropdownMenuItem>Create Payment Link</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
