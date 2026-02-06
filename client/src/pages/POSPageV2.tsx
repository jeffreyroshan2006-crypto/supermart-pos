import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-v2';
import { useCart } from '@/hooks/use-cart';
import { useKeyboardShortcuts, useBarcodeScanner, useHeldBills, POS_SHORTCUTS } from '@/hooks/use-pos-shortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { HeldBillsModal } from '@/components/pos/HeldBillsModal';
import { CustomerSelector } from '@/components/pos/CustomerSelector';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartItemList } from '@/components/pos/CartItemList';
import { BillTotals } from '@/components/pos/BillTotals';
import { QuickActions } from '@/components/pos/QuickActions';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { Search, ShoppingCart, User, Pause, Trash2, Calculator, Keyboard, Receipt } from 'lucide-react';
import { Product, Customer, PaymentMode } from '@shared/schema';
import { cn, formatCurrency } from '@/lib/utils';

export default function POSPage() {
  const { toast } = useToast();
  const { user, currentStore, hasPermission } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const {
    cart,
    addItem,
    updateQuantity,
    updateItemDiscount,
    removeItem,
    setCustomer,
    setBillDiscount,
    setNotes,
    clearCart,
    totals,
  } = useCart();

  const { heldBills, holdBill, resumeBill } = useHeldBills();

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', currentStore?.id, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory.toString());
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    },
    enabled: !!currentStore,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Search products
  const { data: searchResults = [] } = useQuery({
    queryKey: ['products', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search products');
      return response.json() as Promise<Product[]>;
    },
    enabled: searchQuery.length >= 2,
  });

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create bill');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Bill completed!',
        description: `Bill #${data.billNumber} - Total: ${formatCurrency(totals.grandTotal)}`,
      });
      clearCart();
      setShowCheckout(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Barcode scanner handler
  useBarcodeScanner((barcode) => {
    const product = products.find(p => p.sku === barcode || p.barcode === barcode);
    if (product) {
      addItem(product);
      toast({
        title: 'Product added',
        description: `${product.name} added to cart`,
      });
    } else {
      // Try to search for the product
      fetch(`/api/products/search?barcode=${encodeURIComponent(barcode)}`)
        .then(res => res.json())
        .then((results: Product[]) => {
          if (results.length > 0) {
            addItem(results[0]);
            toast({
              title: 'Product added',
              description: `${results[0].name} added to cart`,
            });
          } else {
            toast({
              title: 'Product not found',
              description: `No product found with barcode: ${barcode}`,
              variant: 'destructive',
            });
          }
        });
    }
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...POS_SHORTCUTS.search,
      handler: () => searchInputRef.current?.focus(),
    },
    {
      ...POS_SHORTCUTS.checkout,
      handler: () => {
        if (cart.items.length > 0) setShowCheckout(true);
      },
    },
    {
      ...POS_SHORTCUTS.hold,
      handler: async () => {
        if (cart.items.length > 0) {
          await holdBill(cart, cart.customerName || undefined);
          clearCart();
          toast({ title: 'Bill on hold', description: 'Cart has been held for later' });
        }
      },
    },
    {
      ...POS_SHORTCUTS.clear,
      handler: () => {
        if (confirm('Clear the cart?')) clearCart();
      },
    },
    {
      ...POS_SHORTCUTS.help,
      handler: () => setShowShortcuts(true),
    },
  ]);

  const handleCheckout = async (paymentData: {
    mode: PaymentMode;
    payments?: { mode: string; amount: number; reference?: string }[];
  }) => {
    const billData = {
      customerId: cart.customer?.id,
      customerName: cart.customerName || undefined,
      customerPhone: cart.customerPhone || undefined,
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.sellingPrice),
        discountPercent: Number(item.discountPercent || 0),
      })),
      paymentMode: paymentData.mode,
      payments: paymentData.payments,
      billDiscountAmount: cart.billDiscountAmount,
      billDiscountPercent: cart.billDiscountPercent,
      loyaltyPointsRedeemed: cart.loyaltyPointsRedeemed,
      notes: cart.notes,
    };

    createBillMutation.mutate(billData);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Left Panel - Cart */}
      <div className="w-[450px] flex flex-col glass-card border-r border-white/20 dark:border-white/5">
        {/* Cart Header */}
        <div className="p-4 border-b border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Current Sale</h2>
                <p className="text-xs text-muted-foreground">{totals.itemCount} items</p>
              </div>
            </div>
            <div className="flex gap-2">
              {heldBills.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHeldBills(true)}
                  className="glass-btn"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Held ({heldBills.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                className="glass-btn"
              >
                <Keyboard className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Customer Selector */}
          <CustomerSelector
            customer={cart.customer}
            customerName={cart.customerName}
            onSelect={setCustomer}
          />
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          <CartItemList
            items={cart.items}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateItemDiscount}
            onRemove={removeItem}
          />
        </ScrollArea>

        {/* Cart Footer */}
        <div className="p-4 border-t border-white/20 dark:border-white/5 bg-white/5 dark:bg-black/20">
          <BillTotals totals={totals} />
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => holdBill(cart)}
              disabled={cart.items.length === 0}
              className="glass-btn h-12"
            >
              <Pause className="w-4 h-4 mr-2" />
              Hold (Ctrl+H)
            </Button>
            <Button
              onClick={() => setShowCheckout(true)}
              disabled={cart.items.length === 0}
              className="glass-btn-primary h-12 text-base font-semibold"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Checkout (F2)
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-white/20 dark:border-white/5 glass">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search products (F) or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg glass-input"
              />
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                  <div className="glass-card p-2 max-h-80 overflow-auto">
                    {searchResults.length === 0 ? (
                      <p className="text-muted-foreground p-4 text-center">No products found</p>
                    ) : (
                      searchResults.map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            addItem(product);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                          <p className="font-bold">{formatCurrency(Number(product.sellingPrice))}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <QuickActions
              onClear={() => confirm('Clear cart?') && clearCart()}
              onShowCalculator={() => {}}
              hasItems={cart.items.length > 0}
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1 p-4">
          <ProductGrid
            products={products}
            onAdd={addItem}
            isLoading={isLoadingProducts}
          />
        </ScrollArea>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t border-white/20 dark:border-white/5 bg-white/5 dark:bg-black/20 text-sm text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Store: <strong>{currentStore?.name}</strong></span>
            <span>Cashier: <strong>{user?.name}</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Press <kbd className="px-2 py-0.5 bg-white/10 rounded">?</kbd> for shortcuts</span>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        totals={totals}
        onComplete={handleCheckout}
        isProcessing={createBillMutation.isPending}
      />

      {/* Held Bills Modal */}
      <HeldBillsModal
        open={showHeldBills}
        onClose={() => setShowHeldBills(false)}
        heldBills={heldBills}
        onResume={resumeBill}
      />

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="glass-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {Object.entries(POS_SHORTCUTS).map(([key, shortcut]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-white/10 rounded font-mono text-sm">
                  {shortcut.ctrl && 'Ctrl + '}
                  {shortcut.alt && 'Alt + '}
                  {shortcut.shift && 'Shift + '}
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
