import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  onCartClick: () => void;
  cartCount: number;
  onSearch: (query: string) => void;
  settings: StoreSettings;
}

export default function Header({ onCartClick, cartCount, onSearch, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-ink/5">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 overflow-hidden">
            <img 
              src={settings.logoDataUrl || settings.logoUrl || '/logo.png'} 
              alt={settings.companyName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/200x200?text=' + settings.companyName;
              }}
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-serif font-bold text-brand-ink leading-none">{settings.companyName}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mt-1">Distribuidora</p>
          </div>
        </div>

        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold transition-colors" />
          <input 
            type="text"
            placeholder="Buscar produtos..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-11 bg-brand-ink/5 border border-transparent focus:border-brand-gold/30 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
          />
        </div>

        <button 
          onClick={onCartClick}
          className="relative w-11 h-11 bg-brand-ink text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-brand-ink text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
