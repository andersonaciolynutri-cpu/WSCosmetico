import React from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  quantity: number;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export default function ProductCard({ product, quantity, onUpdateQuantity }: ProductCardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-brand-ink/5 flex flex-col group hover:shadow-xl hover:shadow-brand-ink/5 transition-all duration-500">
      <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 bg-brand-paper relative">
        <img 
          src={product.imageDataUrl || product.imageUrl || '/placeholder-product.png'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://placehold.co/400x400?text=' + product.name;
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[8px] font-bold uppercase tracking-widest text-brand-gold shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      <div className="flex-1 px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-1">{product.brand}</p>
        <h3 className="text-sm font-serif font-bold text-brand-ink line-clamp-2 leading-tight mb-2 h-10">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-brand-gold">{formatCurrency(product.price)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {quantity > 0 ? (
          <div className="flex items-center bg-brand-paper rounded-2xl p-1 w-full border border-brand-ink/5">
            <button 
              onClick={() => onUpdateQuantity(product.id, -1)}
              className="w-8 h-8 flex items-center justify-center text-brand-ink hover:bg-white rounded-xl transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-bold text-sm text-brand-ink">{quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(product.id, 1)}
              className="w-8 h-8 flex items-center justify-center text-brand-ink hover:bg-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onUpdateQuantity(product.id, 1)}
            className="w-full h-10 bg-brand-ink text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-brand-ink transition-all active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Adicionar
          </button>
        )}
      </div>
    </div>
  );
}
