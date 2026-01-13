import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Search, Filter, MoreHorizontal, Phone, Mail, Download, ChevronDown
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, isRoleAllowedToMarkPaid } from '@/hooks/useUserRole';
import { Constants } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
    'new': 'bg-blue-500/10 text-blue-500',
    'interested': 'bg-yellow-500/10 text-yellow-500',
    'paid': 'bg-green-500/10 text-green-500',
    'follow_up': 'bg-purple-500/10 text-purple-500',
    'dnd': 'bg-red-500/10 text-red-500',
    'not_interested': 'bg-gray-500/10 text-gray-500',
    'rnr': 'bg-orange-500/10 text-orange-500',
};

export default function Interested() {
    const [searchQuery, setSearchQuery] = useState('');
    // Filter for 'interested' status
    const { data: leadsData, isLoading } = useLeads({ search: searchQuery, statusFilter: 'interested' });
    const leads = leadsData?.leads || [];
    const { products } = useProducts();
    const updateLead = useUpdateLead();
    const { user } = useAuth();
    const { data: userRole } = useUserRole();

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            await updateLead.mutateAsync({
                id: leadId,
                status: newStatus as any
            });
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const { data: owners } = useQuery({
        queryKey: ['leadsFilterOptionsOwners'],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .not('full_name', 'is', null);
            return data?.map(o => ({ label: o.full_name || 'Unknown', value: o.id })) || [];
        }
    });

    const handleProductChange = async (leadId: string, productName: string) => {
        if (!productName || productName === 'none') return;

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
    };



    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Interested Leads</h1>
                        <p className="text-muted-foreground">Leads marked as interested and ready for follow-up.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search interested leads..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>College</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Payment Link</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                            No interested leads found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads?.map((lead) => (
                                        <TableRow key={lead.id}>
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
                                            <TableCell>
                                                <Select
                                                    defaultValue={lead.status}
                                                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                                                >
                                                    <SelectTrigger className={`w-[140px] h-8 ${statusColors[lead.status] || 'bg-secondary'}`}>
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Constants.public.Enums.lead_status.map((status) => (
                                                            <SelectItem
                                                                key={status}
                                                                value={status}
                                                                className="capitalize"
                                                                disabled={status === 'paid' && !isRoleAllowedToMarkPaid(userRole)}
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {lead.sales_owner?.full_name || owners?.find(o => o.value === lead.sales_owner_id)?.label || 'Unknown'}
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
                                            </TableCell>
                                            <TableCell>
                                                {lead.payment_link ? (
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
                                                        onClick={async () => {
                                                            if (!lead.product_purchased) {
                                                                toast.error('Please select a program first');
                                                                return;
                                                            }

                                                            const selectedProgram = products?.find(p => p.name === lead.product_purchased && (!(lead as any).product_category || p.category === (lead as any).product_category));

                                                            if (!selectedProgram) {
                                                                toast.error('Program details not found');
                                                                return;
                                                            }

                                                            // Convert price to paise (assuming price in DB is in INR)
                                                            const amount = selectedProgram.price * 100;

                                                            try {
                                                                toast.loading('Creating payment link...');
                                                                const { data, error } = await supabase.functions.invoke('create-payment-link', {
                                                                    body: {
                                                                        amount,
                                                                        description: `Payment for ${lead.product_purchased}`,
                                                                        customer: {
                                                                            name: lead.name,
                                                                            email: lead.email || '',
                                                                            phone: lead.phone || ''
                                                                        },
                                                                        reference_id: lead.id
                                                                    }
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
                                                        }}
                                                    >
                                                        Create Link
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div >
        </DashboardLayout >
    );
}
