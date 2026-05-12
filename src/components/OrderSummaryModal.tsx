import React, { useState } from 'react';
import { X, Send, ShoppingCart, Info, User, Phone, MapPin } from 'lucide-react';
import { CartItem, CustomerData, StoreSettings } from '../types';
import { formatCurrency } from '../lib/utils';
import { openWhatsApp } from '../utils/whatsapp';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  settings: StoreSettings;
}

export default function OrderSummaryModal({ isOpen, onClose, items, total, settings }: OrderSummaryModalProps) {
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    phone: '',
    storeName: '',
    document: '',
    address: '',
    observation: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }
    if (items.length === 0) {
      alert('Selecione pelo menos um produto.');
      return;
    }
    openWhatsApp(items, total, formData, settings);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-brand-paper rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-brand-ink/5 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-serif font-bold text-brand-ink">Resumo do Pedido</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mt-1">WS Cosméticos</p>
          </div>
          <button onClick={onClose} className="p-3 bg-brand-ink/5 rounded-2xl hover:bg-brand-ink/10 transition-colors">
            <X className="w-5 h-5 text-brand-ink" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-brand-gold" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Produtos Selecionados</h3>
            </div>
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-3xl border border-brand-ink/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-paper rounded-xl overflow-hidden">
                    <img 
                      src={item.imageDataUrl || item.imageUrl || '/placeholder-product.png'} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + item.name}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-ink leading-none mb-1">{item.name}</h4>
                    <p className="text-[10px] text-brand-ink/40 uppercase font-bold tracking-widest">{item.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-ink">{item.quantity}x {formatCurrency(item.price)}</p>
                  <p className="text-xs font-bold text-brand-gold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center py-8 text-sm text-brand-ink/40">Seu carrinho está vazio.</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-4 h-4 text-brand-gold" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Seus Dados</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Nome *
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome completo"
                  className="w-full h-12 bg-white border border-brand-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Telefone *
                </label>
                <input 
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="w-full h-12 bg-white border border-brand-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nome da Loja (Opcional)</label>
                <input 
                  type="text"
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value})}
                  placeholder="Nome do seu estabelecimento"
                  className="w-full h-12 bg-white border border-brand-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">CPF / CNPJ (Opcional)</label>
                <input 
                  type="text"
                  value={formData.document}
                  onChange={e => setFormData({...formData, document: e.target.value})}
                  placeholder="000.000.000-00"
                  className="w-full h-12 bg-white border border-brand-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Endereço (Opcional)
              </label>
              <input 
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Rua, número, bairro..."
                className="w-full h-12 bg-white border border-brand-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Observações</label>
              <textarea 
                value={formData.observation}
                onChange={e => setFormData({...formData, observation: e.target.value})}
                className="w-full h-24 bg-white border border-brand-ink/5 rounded-3xl p-5 text-sm outline-none focus:border-brand-gold transition-colors resize-none"
                placeholder="Ex: Entrega de manhã, troco para 100 reais..."
              />
            </div>
          </form>
        </div>

        <div className="p-8 bg-white border-t border-brand-ink/5">
          <div className="flex items-center justify-between mb-6 px-2">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-ink/40">Total do Pedido</span>
            <span className="text-2xl font-serif font-bold text-brand-gold">{formatCurrency(total)}</span>
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full h-16 bg-brand-ink text-white rounded-[2rem] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group"
          >
            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span className="uppercase text-xs tracking-[0.2em] font-bold">Enviar pedido pelo WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
