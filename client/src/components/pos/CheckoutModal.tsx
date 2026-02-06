import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote, Wallet, QrCode, Split, Gift, Receipt, Loader2 } from 'lucide-react';
import { CartState } from '@/hooks/use-cart';
import { PaymentMode } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: CartState;
  totals: {
    subtotal: number;
    itemDiscountTotal: number;
    taxableAmount: number;
    taxTotal: number;
    billDiscountAmount: number;
    loyaltyDiscount: number;
    grandTotal: number;
    roundOff: number;
    itemCount: number;
  };
  onComplete: (data: {
    mode: PaymentMode;
    payments?: { mode: string; amount: number; reference?: string }[];
  }) => void;
  isProcessing: boolean;
}

const paymentMethods = [
  { id: 'cash' as PaymentMode, label: 'Cash', icon: Banknote, color: 'text-green-500' },
  { id: 'upi' as PaymentMode, label: 'UPI / QR', icon: QrCode, color: 'text-blue-500' },
  { id: 'card' as PaymentMode, label: 'Card', icon: CreditCard, color: 'text-purple-500' },
  { id: 'wallet' as PaymentMode, label: 'Wallet', icon: Wallet, color: 'text-orange-500' },
  { id: 'split' as PaymentMode, label: 'Split Payment', icon: Split, color: 'text-pink-500' },
];

export function CheckoutModal({
  open,
  onClose,
  cart,
  totals,
  onComplete,
  isProcessing,
}: CheckoutModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [cashReceived, setCashReceived] = useState(totals.grandTotal.toString());
  const [splitPayments, setSplitPayments] = useState<{ mode: string; amount: number; reference?: string }[]>([
    { mode: 'cash', amount: Math.round(totals.grandTotal / 2) },
    { mode: 'upi', amount: Math.round(totals.grandTotal / 2) },
  ]);
  const [referenceNumber, setReferenceNumber] = useState('');

  const change = Math.max(0, parseFloat(cashReceived || '0') - totals.grandTotal);

  const handleComplete = () => {
    if (paymentMode === 'split') {
      const totalSplit = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalSplit - totals.grandTotal) > 0.01) {
        alert('Split payment amounts must equal the total');
        return;
      }
      onComplete({ mode: 'split', payments: splitPayments });
    } else {
      onComplete({
        mode: paymentMode,
        payments: referenceNumber ? [{ mode: paymentMode, amount: totals.grandTotal, reference: referenceNumber }] : undefined,
      });
    }
  };

  const updateSplitPayment = (index: number, field: 'mode' | 'amount' | 'reference', value: string | number) => {
    setSplitPayments(prev =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addSplitPayment = () => {
    setSplitPayments(prev => [...prev, { mode: 'cash', amount: 0 }]);
  };

  const removeSplitPayment = (index: number) => {
    setSplitPayments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0">
          {/* Left - Payment Methods */}
          <div className="p-6 border-r border-white/10">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Payment Method</h3>
            
            <RadioGroup value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)} className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
                      ${paymentMode === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }
                    `}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Icon className={`w-5 h-5 ${method.color}`} />
                    <span className="flex-1 font-medium">{method.label}</span>
                  </label>
                );
              })}
            </RadioGroup>

            {/* Payment-specific fields */}
            <div className="mt-6 space-y-4">
              {paymentMode === 'cash' && (
                <div className="space-y-2">
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-2xl font-bold glass-input"
                    autoFocus
                  />
                  {change > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-green-500">Change to return</span>
                      <span className="text-xl font-bold text-green-500">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {(paymentMode === 'upi' || paymentMode === 'card') && (
                <div className="space-y-2">
                  <Label>Reference Number (optional)</Label>
                  <Input
                    placeholder="Enter transaction ID"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="glass-input"
                  />
                </div>
              )}

              {paymentMode === 'split' && (
                <div className="space-y-3">
                  {splitPayments.map((payment, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={payment.mode}
                        onChange={(e) => updateSplitPayment(index, 'mode', e.target.value)}
                        className="flex-1 h-10 rounded-md bg-white/5 border border-white/10 px-3"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="wallet">Wallet</option>
                      </select>
                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updateSplitPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-28 glass-input"
                      />
                      {splitPayments.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSplitPayment(index)}
                          className="text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSplitPayment} className="w-full">
                    + Add Payment
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right - Bill Summary */}
          <div className="p-6 flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Bill Summary</h3>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.tempId} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(Number(item.sellingPrice))}
                      </p>
                    </div>
                    <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4 bg-white/10" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.itemDiscountTotal > 0 && (
                <div className="flex items-center justify-between text-sm text-green-500">
                  <span>Item Discounts</span>
                  <span>-{formatCurrency(totals.itemDiscountTotal)}</span>
                </div>
              )}
              {totals.taxTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(totals.taxTotal)}</span>
                </div>
              )}
              {totals.billDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-500">
                  <span>Bill Discount</span>
                  <span>-{formatCurrency(totals.billDiscountAmount)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(totals.grandTotal)}</span>
            </div>

            <Button
              onClick={handleComplete}
              disabled={isProcessing}
              className="w-full mt-6 h-14 text-lg font-semibold glass-btn-primary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Complete Payment</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
