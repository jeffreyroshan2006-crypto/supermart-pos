import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useProducts } from "@/hooks/use-products";
import { useCreateBill } from "@/hooks/use-bills";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { ProductCard } from "@/components/ProductCard";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Plus, UserPlus, ShoppingCart, Minus } from "lucide-react";
import type { Product, InsertCustomer, Bill } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [lastCreatedBill, setLastCreatedBill] = useState<Bill | undefined>(undefined);

  // Queries
  const { data: products, isLoading: isLoadingProducts } = useProducts(search, category === "all" ? undefined : category);
  const { data: customers } = useCustomers();
  
  // Mutations
  const createBill = useCreateBill();
  const createCustomer = useCreateCustomer();
  const { toast } = useToast();

  // Categories logic
  const categories = ["all", ...Array.from(new Set(products?.map(p => p.category) || []))];

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast({ title: "Stock Limit", description: "Cannot add more than available stock", variant: "destructive" });
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.product.stockQuantity) return item;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Totals
  const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.sellingPrice) * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + (Number(item.product.sellingPrice) * item.quantity * (Number(item.product.gstRate) / 100)), 0);
  const total = subtotal + tax;

  // Checkout Handler
  const handleCheckout = (paymentMode: any, billDiscountAmount: number) => {
    createBill.mutate({
      paymentMode,
      customerId: selectedCustomerId === "walk-in" ? undefined : Number(selectedCustomerId),
      items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      billDiscountAmount
    }, {
      onSuccess: (bill) => {
        toast({ title: "Success", description: "Bill created successfully" });
        setLastCreatedBill(bill);
        setCart([]);
        setSelectedCustomerId("walk-in");
      }
    });
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setLastCreatedBill(undefined);
  };

  // New Customer Handler
  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertCustomer = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string || null,
      email: formData.get("email") as string || null,
    };
    
    createCustomer.mutate(data, {
      onSuccess: (newCustomer) => {
        toast({ title: "Customer Created", description: `${newCustomer.name} added.` });
        setIsNewCustomerOpen(false);
        setSelectedCustomerId(String(newCustomer.id));
      }
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      {/* Main Content - Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center px-6 justify-between bg-card">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name or SKU..." 
                className="pl-9 bg-muted/50 border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/20">
          {isLoadingProducts ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p>No products found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products?.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-96 bg-card border-l flex flex-col shadow-xl z-10">
        <div className="p-4 border-b">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Current Order
          </h2>
        </div>

        {/* Customer Selection */}
        <div className="p-4 border-b bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-primary hover:text-primary/80 px-0"
              onClick={() => setIsNewCustomerOpen(true)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              New Customer
            </Button>
          </div>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.phone || "No phone"})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
              <ShoppingCart className="h-8 w-8" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm truncate" title={item.product.name}>{item.product.name}</h4>
                      <p className="font-semibold text-sm ml-2">₹{(Number(item.product.sellingPrice) * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">₹{item.product.sellingPrice} / unit</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md h-7">
                        <button 
                          className="px-2 hover:bg-muted h-full flex items-center"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          className="px-2 hover:bg-muted h-full flex items-center"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals Section */}
        <div className="p-4 border-t bg-muted/10 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full py-6 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={handleCloseCheckout}
        onConfirm={handleCheckout}
        totalAmount={total}
        isProcessing={createBill.isPending}
        lastCreatedBill={lastCreatedBill}
      />

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" name="email" type="email" placeholder="john@example.com" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewCustomerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
