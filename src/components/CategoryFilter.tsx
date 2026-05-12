import React from 'react';
import { CategoryID } from '../types';
import { cn } from '../lib/utils';
import { 
  Palette, 
  Sparkles, 
  Bath, 
  Flower2, 
  Baby
} from 'lucide-react';

const CATEGORIES: { id: CategoryID; label: string; icon: any }[] = [
  { id: 'Make', label: 'Make', icon: Palette },
  { id: 'Cabelo', label: 'Cabelo', icon: Sparkles },
  { id: 'Higiene Pessoal', label: 'Higiene', icon: Bath },
  { id: 'Beleza', label: 'Beleza', icon: Flower2 },
  { id: 'Bebê', label: 'Bebê', icon: Baby },
];

interface CategoryFilterProps {
  selectedCategory: CategoryID | 'todos';
  onSelect: (category: CategoryID | 'todos') => void;
}

export default function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        onClick={() => onSelect('todos')}
        className={cn(
          "flex-shrink-0 px-6 h-12 rounded-2xl flex items-center gap-3 border transition-all",
          selectedCategory === 'todos'
            ? "bg-brand-ink border-brand-ink text-white shadow-lg shadow-brand-ink/20"
            : "bg-white border-brand-ink/5 text-brand-ink/60 hover:border-brand-gold/30 hover:text-brand-ink"
        )}
      >
        <span className="text-xs font-bold uppercase tracking-widest">Todos</span>
      </button>

      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex-shrink-0 px-6 h-12 rounded-2xl flex items-center gap-3 border transition-all",
              selectedCategory === cat.id
                ? "bg-brand-gold border-brand-gold text-brand-ink shadow-lg shadow-brand-gold/20"
                : "bg-white border-brand-ink/5 text-brand-ink/60 hover:border-brand-gold/30 hover:text-brand-ink"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
