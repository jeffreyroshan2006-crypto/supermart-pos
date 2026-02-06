import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import { CartItem } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';

interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (tempId: string, quantity: number) => void;
  onUpdateDiscount: (tempId: string, discountPercent: number) => void;
  onRemove: (tempId: string) => void;
}

export function CartItemList({ items, onUpdateQuantity, onUpdateDiscount, onRemove }: CartItemListProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Tag className="w-10 h-10 opacity-50" />
        </div>
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-sm">Scan or search to add products</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.tempId}
          className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{item.productName}</h4>
              <p className="text-xs text-muted-foreground">{item.productSku}</p>
              
              {/* Price info */}
              <div className="flex items-center gap-2 mt-1 text-sm">
                <span className="font-semibold">{formatCurrency(Number(item.sellingPrice))}</span>
                {Number(item.discountPercent) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.discountPercent}% off
                  </Badge>
                )}
              </div>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => onUpdateQuantity(item.tempId, Number(item.quantity) - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.tempId, parseFloat(e.target.value) || 0)}
                className="w-14 h-7 text-center text-sm glass-input px-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => onUpdateQuantity(item.tempId, Number(item.quantity) + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Discount & Total */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Disc %"
                value={item.discountPercent || ''}
                onChange={(e) => onUpdateDiscount(item.tempId, parseFloat(e.target.value) || 0)}
                className="w-20 h-6 text-xs glass-input"
              />
            </div>
            <div className="text-right">
              <p className="font-bold">{formatCurrency(item.totalAmount)}</p>
              {item.taxAmount > 0 && (
                <p className="text-xs text-muted-foreground">Tax: {formatCurrency(item.taxAmount)}</p>
              )}
            </div>
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            onClick={() => onRemove(item.tempId)}
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
