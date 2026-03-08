import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Pencil, Trash2, Loader2, Coins } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { INSURANCE_TYPES, CONTRIBUTION_FREQUENCIES } from './config';
import { Textarea } from '@/components/ui/textarea';

export default function ManageInsurancePlans() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sumInsured, setSumInsured] = useState('');
  const [contributionFrequency, setContributionFrequency] = useState('');
  const [policyTerm, setPolicyTerm] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setCategory(product.category);
      setName(product.name);
      setPrice(product.price.toString());
      const meta = (product as any).metadata || {};
      setSumInsured(meta.sum_insured?.toString() || '');
      setContributionFrequency(meta.contribution_frequency || '');
      setPolicyTerm(meta.policy_term?.toString() || '');
      setDescription(meta.description || '');
    } else {
      setEditingProduct(null);
      setCategory(''); setName(''); setPrice(''); setSumInsured('');
      setContributionFrequency(''); setPolicyTerm(''); setDescription('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!category.trim() || !name.trim() || !price) {
      toast({ title: "Validation Error", description: "Insurance Type, Plan Name, and Premium are required.", variant: "destructive" });
      return;
    }
    const productData = {
      category: category.trim(),
      name: name.trim(),
      price: parseFloat(price),
      quantity_available: null,
      metadata: {
        sum_insured: sumInsured ? parseFloat(sumInsured) : null,
        contribution_frequency: contributionFrequency || null,
        policy_term: policyTerm ? parseInt(policyTerm) : null,
        description: description || null,
      }
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      setIsDialogOpen(false);
    } catch { /* handled by hook */ }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) await deleteProduct.mutateAsync(id);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance Plans</h1>
          <p className="text-muted-foreground">Manage your insurance plan catalog with premium and contribution details.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gradient-primary"><Plus className="h-4 w-4 mr-2" />Add Plan</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Insurance Plan' : 'Add New Insurance Plan'}</DialogTitle>
            <DialogDescription>Configure plan details, premium, and contribution frequency.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Insurance Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{INSURANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Plan Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Term Plan 1Cr" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Premium Amount (₹)</Label><div className="relative"><Coins className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-8" placeholder="15000" /></div></div>
              <div className="space-y-2"><Label>Sum Insured (₹)</Label><Input type="number" value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} placeholder="10000000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contribution Frequency</Label>
                <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CONTRIBUTION_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Policy Term (Years)</Label><Input type="number" value={policyTerm} onChange={(e) => setPolicyTerm(e.target.value)} placeholder="20" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Plan details..." className="min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!category || !name || !price}>
              {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="glass">
          <CardHeader><CardTitle>All Insurance Plans</CardTitle><CardDescription>{products?.length || 0} plans available</CardDescription></CardHeader>
          <CardContent>
            {products?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No plans found. Add your first insurance plan.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurance Type</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Sum Insured</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => {
                    const meta = (product as any).metadata || {};
                    return (
                      <TableRow key={product.id}>
                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>₹{product.price.toLocaleString()}</TableCell>
                        <TableCell>{meta.sum_insured ? `₹${Number(meta.sum_insured).toLocaleString()}` : '-'}</TableCell>
                        <TableCell>{meta.contribution_frequency || '-'}</TableCell>
                        <TableCell>{meta.policy_term ? `${meta.policy_term} yrs` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
