import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface HeldBill {
  id: number;
  holdReference: string;
  customerName?: string;
  subtotal: number;
  heldAt: string;
  itemCount: number;
}

interface HeldBillsModalProps {
  open: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResume: (heldBillId: number) => Promise<any>;
}

export function HeldBillsModal({ open, onClose, heldBills, onResume }: HeldBillsModalProps) {
  const handleResume = async (heldBillId: number) => {
    const cartData = await onResume(heldBillId);
    if (cartData) {
      onClose();
      // The parent component should handle loading the cart data
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Held Bills ({heldBills.length})
          </DialogTitle>
        </DialogHeader>

        {heldBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No held bills</p>
            <p className="text-sm">Press Ctrl+H to hold a bill</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {heldBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{bill.holdReference}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {formatDistanceToNow(new Date(bill.heldAt), { addSuffix: true })}
                        </Badge>
                      </div>
                      {bill.customerName && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {bill.customerName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {bill.itemCount} items • ₹{bill.subtotal}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleResume(bill.id)}
                    className="glass-btn-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
