import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentModes, type Bill } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Loader2, CreditCard, Banknote, Smartphone, Wallet, CheckCircle2, MessageSquare, Share2 } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMode: typeof paymentModes[number], billDiscountAmount: number) => void;
  totalAmount: number;
  isProcessing: boolean;
  lastCreatedBill?: Bill;
}

export function CheckoutModal({ isOpen, onClose, onConfirm, totalAmount, isProcessing, lastCreatedBill }: CheckoutModalProps) {
  const [paymentMode, setPaymentMode] = useState<typeof paymentModes[number]>("cash");
  const [billDiscountAmount, setBillDiscountAmount] = useState<number>(0);

  const finalTotal = Math.max(0, totalAmount - billDiscountAmount);

  const handleConfirm = () => {
    onConfirm(paymentMode, billDiscountAmount);
  };

  const getIcon = (mode: string) => {
    switch (mode) {
      case "cash": return <Banknote className="h-4 w-4 mr-2" />;
      case "card": return <CreditCard className="h-4 w-4 mr-2" />;
      case "upi": return <Smartphone className="h-4 w-4 mr-2" />;
      case "wallet": return <Wallet className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };

  const generateBillText = () => {
    if (!lastCreatedBill) return "";

    // Smartly determine the base URL:
    // 1. If we have a configured public URL (e.g. env var), use it.
    // 2. If current host is localhost, try to suggesting the Network IP for better sharing.
    // 3. Fallback to window.location.origin.

    let baseUrl = window.location.origin;

    // If running on localhost, substitute with the known Network IP for sharing
    // This allows the user to click 'share' from localhost and still send a working link to others on Wi-Fi
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Using the detected IP address
      baseUrl = `http://10.196.188.90:3000`;
    }

    const url = `${baseUrl}/public/bill/${lastCreatedBill.publicId}`;
    return `Hi! Here is your bill from SuperMart POS: ${url}. Total Amount: ₹${lastCreatedBill.grandTotal}. Thank you for shopping with us!`;
  };

  const shareViaWhatsApp = () => {
    if (!lastCreatedBill) return;
    const text = generateBillText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaSMS = () => {
    if (!lastCreatedBill) return;
    const text = generateBillText();
    window.open(`sms:?body=${encodeURIComponent(text)}`);
  };

  if (lastCreatedBill) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md text-center p-10">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-center">Payment Successful!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Bill <span className="font-mono font-bold text-foreground">#{lastCreatedBill.billNumber}</span> has been generated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 mt-8">
            <Button onClick={shareViaWhatsApp} variant="outline" className="h-12 border-green-200 hover:bg-green-50 text-green-700">
              <MessageSquare className="mr-2 h-5 w-5" /> Share via WhatsApp
            </Button>
            <Button onClick={shareViaSMS} variant="outline" className="h-12 border-blue-200 hover:bg-blue-50 text-blue-700">
              <Share2 className="mr-2 h-5 w-5" /> Share via SMS
            </Button>
          </div>

          <div className="mt-8">
            <Button onClick={onClose} className="w-full h-11">
              Start New Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Complete Payment</DialogTitle>
          <DialogDescription>
            Confirm the payment details to finalize the bill.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Bill Total</Label>
            <div className="text-3xl font-bold text-primary">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                value={billDiscountAmount}
                onChange={(e) => setBillDiscountAmount(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Final Amount</Label>
              <div className="h-10 px-3 py-2 rounded-md bg-muted font-mono font-semibold flex items-center">
                ₹{finalTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMode}
              onValueChange={(val: any) => setPaymentMode(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    <div className="flex items-center capitalize">
                      {getIcon(mode)}
                      {mode}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
