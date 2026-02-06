import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calculator, Trash2, Percent, Tag } from 'lucide-react';

interface QuickActionsProps {
  onClear: () => void;
  onShowCalculator: () => void;
  hasItems: boolean;
}

export function QuickActions({ onClear, onShowCalculator, hasItems }: QuickActionsProps) {
  const [discountPercent, setDiscountPercent] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="glass-btn"
            onClick={onShowCalculator}
          >
            <Calculator className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 glass-card p-4">
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((key) => (
              <Button
                key={key}
                variant={key === '=' ? 'default' : 'outline'}
                size="sm"
                className="h-10 text-lg font-mono"
              >
                {key}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={showDiscount} onOpenChange={setShowDiscount}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="glass-btn"
            disabled={!hasItems}
          >
            <Percent className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 glass-card p-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Quick Discount
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {['5%', '10%', '15%', '20%', '25%', 'Custom'].map((discount) => (
                <Button
                  key={discount}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (discount !== 'Custom') {
                      // Apply discount
                      setShowDiscount(false);
                    }
                  }}
                >
                  {discount}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Custom %"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="glass-input"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="glass-btn text-destructive hover:text-destructive"
        onClick={onClear}
        disabled={!hasItems}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
