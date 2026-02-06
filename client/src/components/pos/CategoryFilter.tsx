import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: number | null;
  onSelect: (categoryId: number | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap mt-4">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            selected === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
              selected === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
