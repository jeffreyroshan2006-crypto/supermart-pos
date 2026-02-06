import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface Totals {
  subtotal: number;
  itemDiscountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  billDiscountAmount: number;
  loyaltyDiscount: number;
  grandTotal: number;
  roundOff: number;
  itemCount: number;
}

interface BillTotalsProps {
  totals: Totals;
}

export function BillTotals({ totals }: BillTotalsProps) {
  return (
    <div className="space-y-2">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal ({totals.itemCount} items)</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>

      {/* Item discounts */}
      {totals.itemDiscountTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-green-500">
          <span>Item Discounts</span>
          <span>-{formatCurrency(totals.itemDiscountTotal)}</span>
        </div>
      )}

      {/* Tax */}
      {totals.taxTotal > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax (GST)</span>
          <span>{formatCurrency(totals.taxTotal)}</span>
        </div>
      )}

      {/* Bill discount */}
      {totals.billDiscountAmount > 0 && (
        <div className="flex items-center justify-between text-sm text-green-500">
          <span>Bill Discount</span>
          <span>-{formatCurrency(totals.billDiscountAmount)}</span>
        </div>
      )}

      {/* Loyalty */}
      {totals.loyaltyDiscount > 0 && (
        <div className="flex items-center justify-between text-sm text-purple-500">
          <span>Loyalty Points</span>
          <span>-{formatCurrency(totals.loyaltyDiscount)}</span>
        </div>
      )}

      {/* Round off */}
      {totals.roundOff !== 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Round off</span>
          <span>{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff)}</span>
        </div>
      )}

      <Separator className="my-2 bg-white/10" />

      {/* Grand Total */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">Grand Total</span>
        <span className="text-2xl font-bold text-primary">{formatCurrency(totals.grandTotal)}</span>
      </div>
    </div>
  );
}
