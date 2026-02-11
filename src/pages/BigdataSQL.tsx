import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, Search, Database, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface TableSchema {
    column_name: string;
    data_type: string;
    is_nullable: string;
}

interface QueryResponse {
    data: any[];
    hasMore?: boolean;
    limit?: number;
    offset?: number;
}

export default function BigdataSQL() {
    const { user } = useAuth();
    const { isCompanyAdmin, loading: companyLoading } = useCompany();
    const { toast } = useToast();

    const [selectedTable, setSelectedTable] = useState<string>('');
    const [phoneSearch, setPhoneSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [page, setPage] = useState(0);
    const [limit] = useState(25);

    // Fetch available tables - call hook unconditionally
    const { data: tablesData, isLoading: tablesLoading } = useQuery({
        queryKey: ['bigdata-tables'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error('No session found');
                throw new Error('No session');
            }

            console.log('Calling query-bigdata-sql with action: list_tables');
            const response = await supabase.functions.invoke('query-bigdata-sql', {
                body: { action: 'list_tables' }
            });

            console.log('Edge Function Response:', response);

            if (response.error) {
                console.error('Edge Function error:', response.error);
                throw response.error;
            }

            if (response.data?.error) {
                console.error('Edge Function returned error:', response.data.error);
                toast({
                    title: "Error",
                    description: response.data.error,
                    variant: "destructive"
                });
                throw new Error(response.data.error);
            }

            return response.data.data as { table_name: string }[];
        },
        enabled: !companyLoading && isCompanyAdmin // Only run query if admin
    });

    // Fetch table schema when table is selected - call hook unconditionally
    const { data: schemaData, isLoading: schemaLoading } = useQuery({
        queryKey: ['bigdata-schema', selectedTable],
        queryFn: async () => {
            if (!selectedTable) return null;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const response = await supabase.functions.invoke('query-bigdata-sql', {
                body: { action: 'get_schema', tableName: selectedTable }
            });

            if (response.error) throw response.error;
            return response.data.data as TableSchema[];
        },
        enabled: !!selectedTable && !companyLoading && isCompanyAdmin
    });

    // Fetch table data - call hook unconditionally
    const { data: tableData, isLoading: dataLoading, refetch } = useQuery({
        queryKey: ['bigdata-query', selectedTable, filters, phoneSearch, page],
        queryFn: async () => {
            if (!selectedTable) return null;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const response = await supabase.functions.invoke('query-bigdata-sql', {
                body: {
                    action: 'query_data',
                    tableName: selectedTable,
                    filters: Object.keys(filters).length > 0 ? filters : undefined,
                    phoneSearch: phoneSearch || undefined,
                    limit,
                    offset: page * limit
                }
            });

            if (response.error) throw response.error;
            return response.data as QueryResponse;
        },
        enabled: !!selectedTable && !companyLoading && isCompanyAdmin
    });

    // Show loading state while checking admin access
    if (companyLoading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Check admin access
    if (!isCompanyAdmin) {
        return (
            <div className="p-8">
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-center text-red-500">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                            <p>Only company administrators can access the Bigdata SQL interface.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleTableChange = (value: string) => {
        setSelectedTable(value);
        setFilters({});
        setPhoneSearch('');
        setPage(0);
    };

    const handleFilterChange = (column: string, value: string) => {
        setFilters(prev => {
            if (value === '') {
                const newFilters = { ...prev };
                delete newFilters[column];
                return newFilters;
            }
            return { ...prev, [column]: value };
        });
        setPage(0);
    };

    const handlePhoneSearch = () => {
        setPage(0);
        refetch();
    };

    const handleDownloadCSV = () => {
        if (!tableData?.data || tableData.data.length === 0) {
            toast({
                title: "No data to download",
                description: "Please select a table and load data first.",
                variant: "destructive"
            });
            return;
        }

        // Convert data to CSV
        const rows = tableData.data;
        const headers = Object.keys(rows[0]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedTable}_page${page + 1}_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Download started",
            description: `Downloading ${tableData.data.length} records from current page...`
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    Bigdata SQL
                </h1>
                <p className="text-muted-foreground">Query and export data from the external database</p>
            </div>

            {/* Table Selector */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Select Table</CardTitle>
                    <CardDescription>Choose a table to view and query</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div>
                            <Label>Table</Label>
                            <Select value={selectedTable} onValueChange={handleTableChange} disabled={tablesLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select a table"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {tablesData?.map((table) => (
                                        <SelectItem key={table.table_name} value={table.table_name}>
                                            {table.table_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Phone Search */}
                        {selectedTable && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label>Phone Number Search</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Search by phone number..."
                                            value={phoneSearch}
                                            onChange={(e) => setPhoneSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()}
                                        />
                                        <Button onClick={handlePhoneSearch} disabled={dataLoading}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            {selectedTable && schemaData && (
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Column Filters
                        </CardTitle>
                        <CardDescription>Filter data by column values</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schemaData.slice(0, 10).map((column) => (
                                <div key={column.column_name}>
                                    <Label className="text-xs">{column.column_name}</Label>
                                    <Input
                                        placeholder={`Filter ${column.column_name}...`}
                                        value={filters[column.column_name] || ''}
                                        onChange={(e) => handleFilterChange(column.column_name, e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                        {schemaData.length > 10 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Showing first 10 columns. More columns available in the data table.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            {selectedTable && (
                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Data - Page {page + 1}</CardTitle>
                                <CardDescription>
                                    Showing {tableData?.data?.length || 0} records
                                </CardDescription>
                            </div>
                            <Button onClick={handleDownloadCSV} disabled={!tableData?.data || tableData.data.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Page CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : tableData?.data && tableData.data.length > 0 ? (
                            <>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {Object.keys(tableData.data[0]).map((key) => (
                                                    <TableHead key={key} className="whitespace-nowrap">
                                                        {key}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tableData.data.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    {Object.values(row).map((value: any, cellIdx) => (
                                                        <TableCell key={cellIdx} className="whitespace-nowrap">
                                                            {value !== null && value !== undefined ? String(value) : '-'}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {page + 1} • {tableData.data.length} records on this page
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={!tableData.hasMore}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {selectedTable ? 'No data found' : 'Select a table to view data'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

