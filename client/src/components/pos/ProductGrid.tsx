import React, { useState } from 'react';
import { Product } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

export function ProductGrid({ products, onAdd, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={() => onAdd(product)}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

function ProductCard({ product, onAdd }: ProductCardProps) {
  const isLowStock = Number(product.stockQuantity) <= Number(product.minStockLevel);
  const isOutOfStock = Number(product.stockQuantity) <= 0;

  return (
    <button
      onClick={onAdd}
      disabled={isOutOfStock && !product.allowNegativeStock}
      className={`
        relative group p-4 rounded-xl text-left transition-all duration-200
        ${isOutOfStock && !product.allowNegativeStock
          ? 'opacity-50 cursor-not-allowed bg-white/5'
          : 'bg-white/5 hover:bg-white/10 hover:scale-[1.02] cursor-pointer border border-white/10 hover:border-white/20'
        }
      `}
    >
      {/* Stock indicator */}
      {isLowStock && !isOutOfStock && (
        <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
          Low Stock
        </Badge>
      )}
      
      {isOutOfStock && (
        <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-red-500/20 text-red-400">
          Out of Stock
        </Badge>
      )}

      {/* Product Image Placeholder */}
      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 mb-3 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-2xl font-bold text-white/20">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h4 className="font-medium text-sm line-clamp-2 leading-tight">{product.name}</h4>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-bold text-lg">{formatCurrency(Number(product.sellingPrice))}</p>
            {Number(product.mrp) > Number(product.sellingPrice) && (
              <p className="text-xs text-muted-foreground line-through">
                MRP {formatCurrency(Number(product.mrp))}
              </p>
            )}
          </div>
          
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isOutOfStock && !product.allowNegativeStock
              ? 'bg-muted'
              : 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
            }
            transition-colors
          `}>
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
    </button>
  );
}
