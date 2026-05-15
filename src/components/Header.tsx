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
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 overflow-hidden">
            <img 
              src={settings.logoUrl || '/logo.png'} 
              alt={settings.companyName} 
              className="logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/200x200?text=' + settings.companyName;
              }}
            />
          </div>
          <div className="max-w-[100px] sm:max-w-none">
            <h1 className="text-sm sm:text-xl font-serif font-bold text-brand-ink leading-tight truncate">{settings.companyName}</h1>
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold mt-0.5">Distribuidora</p>
          </div>
        </div>

        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-button-ink/30 group-focus-within:text-brand-gold transition-colors" />
          <input 
            type="text"
            placeholder="Buscar..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-9 sm:h-11 bg-brand-ink/5 border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl pl-9 sm:pl-11 pr-3 sm:pr-4 text-xs sm:text-sm outline-none transition-all"
          />
        </div>

        <button 
          onClick={onCartClick}
          className="relative w-9 h-9 sm:w-11 sm:h-11 bg-brand-ink text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shrink-0"
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-brand-gold text-brand-ink text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
