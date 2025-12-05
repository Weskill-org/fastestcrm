import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash, GripVertical, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select';

interface FormField {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[]; // For select fields
}

export default function FormBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formName, setFormName] = useState(id ? 'Edit Form' : 'New Form');
    const [fields, setFields] = useState<FormField[]>([
        { id: '1', label: 'Full Name', type: 'text', required: true },
        { id: '2', label: 'Email Address', type: 'email', required: true },
        { id: '3', label: 'Phone Number', type: 'phone', required: true },
    ]);

    const addField = () => {
        const newField: FormField = {
            id: Date.now().toString(),
            label: 'New Field',
            type: 'text',
            required: false,
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSave = () => {
        toast({
            title: "Form Saved",
            description: "Your form has been saved successfully.",
        });
        navigate('/dashboard/forms');
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/forms')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{id ? 'Edit Form' : 'Create New Form'}</h1>
                            <p className="text-muted-foreground">Design your lead capture form.</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} className="gradient-primary">
                        <Save className="h-4 w-4 mr-2" />
                        Save Form
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Settings */}
                    <Card className="glass h-fit">
                        <CardHeader>
                            <CardTitle>Form Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="formName">Form Name</Label>
                                <Input
                                    id="formName"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input placeholder="Enter form description" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Field Builder */}
                    <Card className="glass lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Form Fields</CardTitle>
                            <CardDescription>Add and configure fields for your form.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card/50">
                                    <GripVertical className="h-5 w-5 text-muted-foreground mt-3 cursor-move" />
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Field Label</Label>
                                            <Input
                                                value={field.label}
                                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Field Type</Label>
                                            <Select
                                                value={field.type}
                                                onValueChange={(value) => updateField(field.id, { type: value as FieldType })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="phone">Phone</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="textarea">Text Area</SelectItem>
                                                    <SelectItem value="select">Dropdown</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive mt-1" onClick={() => removeField(field.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button variant="outline" className="w-full border-dashed" onClick={addField}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Field
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
