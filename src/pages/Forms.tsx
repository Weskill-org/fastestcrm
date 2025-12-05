import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreHorizontal, FileText, Eye, Edit, Trash } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for forms
const initialForms = [
    { id: 1, name: 'General Inquiry Form', responses: 124, created: '2024-03-01', status: 'Active' },
    { id: 2, name: 'Webinar Registration', responses: 85, created: '2024-03-10', status: 'Active' },
    { id: 3, name: 'Campus Ambassador Application', responses: 42, created: '2024-03-15', status: 'Draft' },
];

export default function Forms() {
    const navigate = useNavigate();
    const [forms, setForms] = useState(initialForms);

    const handleDelete = (id: number) => {
        setForms(forms.filter(f => f.id !== id));
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Forms</h1>
                        <p className="text-muted-foreground">Create and manage your lead capture forms.</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard/forms/new')} className="gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Form
                    </Button>
                </div>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle>All Forms</CardTitle>
                        <CardDescription>Manage your active forms and view responses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Form Name</TableHead>
                                    <TableHead className="text-right">Responses</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {forms.map((form) => (
                                    <TableRow key={form.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {form.name}
                                        </TableCell>
                                        <TableCell className="text-right">{form.responses}</TableCell>
                                        <TableCell className="text-muted-foreground">{form.created}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${form.status === 'Active'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {form.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}`)}>
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 mr-2" /> View Responses
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(form.id)}>
                                                        <Trash className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
