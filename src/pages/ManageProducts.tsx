import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, Pencil, Trash2, Loader2, Coins, Search } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function ManageProducts() {
    const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
    const { toast } = useToast();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);

    // Get unique categories for autocomplete
    const categories = Array.from(new Set(products?.map(p => p.category) || [])).sort();

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setCategory(product.category);
            setName(product.name);
            setPrice(product.price.toString());
            setIsUnlimited(product.quantity_available === null);
            setQuantity(product.quantity_available?.toString() || '');
        } else {
            setEditingProduct(null);
            setCategory('');
            setName('');
            setPrice('');
            setIsUnlimited(true);
            setQuantity('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!category.trim() || !name.trim() || !price) {
            toast({
                title: "Validation Error",
                description: "Category, Name, and Price are required.",
                variant: "destructive"
            });
            return;
        }

        const productData = {
            category: category.trim(),
            name: name.trim(),
            price: parseFloat(price),
            quantity_available: isUnlimited ? null : (parseInt(quantity) || 0)
        };

        try {
            if (editingProduct) {
                await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
            } else {
                await createProduct.mutateAsync(productData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct.mutateAsync(id);
        }
    };

    // Derived state for filtering/search could be added later

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>
                        <p className="text-muted-foreground">Manage your product catalog and pricing.</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                            <DialogDescription>
                                Configure product details, pricing, and availability.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCategoryCombobox}
                                            className="w-full justify-between"
                                        >
                                            {category || "Select or type category..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search category..."
                                                value={category}
                                                onValueChange={setCategory}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="p-2 text-sm text-muted-foreground">
                                                        Press Enter to use current input as new category.
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {categories.map((cat) => (
                                                        <CommandItem
                                                            key={cat}
                                                            value={cat}
                                                            onSelect={(currentValue) => {
                                                                setCategory(currentValue);
                                                                setOpenCategoryCombobox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    category === cat ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {cat}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">Type to create a new category or select existing.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Premium Plan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (₹)</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="pl-8"
                                            placeholder="0.00"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Available Qty"
                                        disabled={isUnlimited}
                                    />
                                    <div className="flex items-center space-x-2 mt-1.5">
                                        <Checkbox
                                            id="unlimited"
                                            checked={isUnlimited}
                                            onCheckedChange={(checked) => setIsUnlimited(checked as boolean)}
                                        />
                                        <label
                                            htmlFor="unlimited"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Unlimited
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!category || !name || !price}>
                                {(createProduct.isPending || updateProduct.isPending) && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Save Product
                            </Button>
                        </DialogFooter>
                    </DialogContent>

                </Dialog>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>All Products</CardTitle>
                            <CardDescription>
                                {products?.length || 0} products available
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {products?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No products found. Add your first product.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Availability</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products?.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{product.category}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>₹{product.price.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    {product.quantity_available === null ? (
                                                        <span className="text-success flex items-center gap-1">
                                                            <Check className="h-3 w-3" /> Unlimited
                                                        </span>
                                                    ) : (
                                                        <span>{product.quantity_available} left</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
