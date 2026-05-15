import React, { useState, useRef } from 'react';
import { X, Send, ShoppingCart, Info, User, Phone, MapPin, Loader2, CheckCircle2, Search } from 'lucide-react';
import { CartItem, CustomerData, StoreSettings, Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { openWhatsApp } from '../utils/whatsapp';
import { orderService } from '../services/orderService';
import { orderPdfService } from '../services/orderPdfService';
import { supabaseStorageService } from '../services/supabaseStorageService';
import { settingsService } from '../services/settingsService';
import { cepService } from '../services/cepService';

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
    email: '',
    document: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    reference: '',
    paymentMethod: undefined,
    changeFor: undefined,
    observations: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const numberInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = cepService.formatCep(value);
    setFormData({ ...formData, zipCode: formatted });
    setCepError(null);

    const cleaned = cepService.cleanCep(value);
    if (cleaned.length === 8) {
      try {
        setIsSearchingCep(true);
        const address = await cepService.fetchAddressByCep(cleaned);
        if (address) {
          setFormData(prev => ({
            ...prev,
            street: address.street,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state
          }));
          // Focus number input after finding address
          setTimeout(() => {
            numberInputRef.current?.focus();
          }, 100);
        }
      } catch (error) {
        setCepError('CEP não encontrado ou erro na consulta.');
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }
    if (items.length === 0) {
      alert('Selecione pelo menos um produto.');
      return;
    }
    if (!formData.paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Get raw app settings from Supabase (for full object)
      const appSettings = await settingsService.getAppSettings();
      if (!appSettings) throw new Error('Configurações não encontradas');

      // 2. Create Order in Supabase
      const order = await orderService.createOrder(formData, items, total);

      // 3. Generate PDF
      const pdfItems = items.map((item, idx) => ({
        id: item.id || idx.toString(),
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));
      
      const pdfBlob = await orderPdfService.generateOrderPdf(order, pdfItems, appSettings);

      // 4. Upload PDF to Storage
      const { url, path } = await supabaseStorageService.uploadOrderPdf(pdfBlob, order.id, order.order_number!);

      // 5. Update Order with PDF info
      const finalOrder = await orderService.updateOrderPdf(order.id, url, path);
      setLastOrder(finalOrder);

      // 6. Download PDF automatically
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Pedido-${order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 7. Open WhatsApp
      openWhatsApp(finalOrder, settings);
      
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onClose();
        // Clear cart globally? App.tsx handles quantities as local state.
        // We should reach out to parent or use an event.
        window.dispatchEvent(new Event("ws_order_completed"));
      }, 5000);

    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-brand-paper sm:rounded-[3rem] rounded-[2rem] shadow-2xl overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <div className="p-5 sm:p-8 border-b border-brand-ink/5 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg sm:text-2xl font-serif font-bold text-brand-ink">Resumo do Pedido</h2>
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold mt-1">WS Cosméticos</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 bg-brand-ink/5 rounded-xl sm:rounded-2xl hover:bg-brand-ink/10 transition-colors">
            <X className="w-5 h-5 text-brand-ink" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
          {/* Items List */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <ShoppingCart className="w-4 h-4 text-brand-gold" />
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-ink/40">Produtos Selecionados</h3>
            </div>
            {items.map(item => (
              <div key={item.id} className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-brand-ink/5 flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-paper rounded-lg sm:rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={item.image_url || '/placeholder-product.png'} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + item.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold text-brand-ink leading-tight mb-0.5 truncate">{item.name}</h4>
                    <p className="text-[9px] text-brand-ink/40 uppercase font-bold tracking-widest truncate">{item.brand}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] sm:text-xs font-bold text-brand-ink">{item.quantity}x {formatCurrency(item.price)}</p>
                  <p className="text-[11px] sm:text-xs font-bold text-brand-gold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center py-6 sm:py-8 text-sm text-brand-ink/40">Seu carrinho está vazio.</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Info className="w-4 h-4 text-brand-gold" />
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-ink/40">Seus Dados</h3>
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
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
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
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">E-mail (Opcional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="seu@email.com"
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">CPF / CNPJ (Opcional)</label>
                <input 
                  type="text"
                  value={formData.document}
                  onChange={e => setFormData({...formData, document: e.target.value})}
                  placeholder="000.000.000-00"
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-ink/40">Endereço de Entrega</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2 flex items-center justify-between">
                  <span>CEP</span>
                  {isSearchingCep && <Loader2 className="w-3 h-3 animate-spin text-brand-gold" />}
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={formData.zipCode}
                    onChange={handleCepChange}
                    maxLength={9}
                    placeholder="00000-000"
                    className={`w-full h-11 sm:h-12 bg-white border ${cepError ? 'border-red-300' : 'border-brand-ink/5'} rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors`}
                  />
                </div>
                {cepError && <p className="text-[9px] text-red-500 px-2 font-medium">{cepError}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Rua / Logradouro</label>
                <input 
                  type="text"
                  value={formData.street}
                  onChange={e => setFormData({...formData, street: e.target.value})}
                  placeholder="Nome da rua"
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Número</label>
                  <input 
                    ref={numberInputRef}
                    type="text"
                    value={formData.number}
                    onChange={e => setFormData({...formData, number: e.target.value})}
                    placeholder="123"
                    className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">UF</label>
                  <input 
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                    maxLength={2}
                    placeholder="SP"
                    className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Complemento</label>
                <input 
                  type="text"
                  value={formData.complement}
                  onChange={e => setFormData({...formData, complement: e.target.value})}
                  placeholder="Apto, Bloco..."
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Bairro</label>
                <input 
                  type="text"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                  placeholder="Seu bairro"
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Cidade</label>
                <input 
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Sua cidade"
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Referência</label>
                <input 
                  type="text"
                  value={formData.reference}
                  onChange={e => setFormData({...formData, reference: e.target.value})}
                  placeholder="Ex: Próximo à padaria..."
                  className="w-full h-11 sm:h-12 bg-white border border-brand-ink/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Info className="w-4 h-4 text-brand-gold" />
                <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-ink/40">Forma de Pagamento *</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Boleto'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        paymentMethod: method as any,
                        changeFor: method === 'Dinheiro' ? prev.changeFor : undefined
                      }));
                    }}
                    className={`h-11 sm:h-14 rounded-xl sm:rounded-2xl border px-2 sm:px-4 flex items-center justify-center text-[11px] sm:text-sm font-bold transition-all ${
                      formData.paymentMethod === method
                        ? 'bg-brand-ink text-white border-brand-ink shadow-lg shadow-brand-ink/20'
                        : 'bg-white text-brand-ink border-brand-ink/5 hover:border-brand-gold hover:text-brand-gold'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {formData.paymentMethod === 'Dinheiro' && (
                <div className="bg-brand-paper/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-brand-gold/10 mt-3 sm:mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Troco para quanto?</label>
                    <div className="relative">
                      <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-gold">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={formData.changeFor || ''}
                        onChange={e => setFormData({...formData, changeFor: e.target.value ? Number(e.target.value) : undefined})}
                        placeholder="0,00"
                        className="w-full h-11 sm:h-12 bg-white border border-brand-gold/20 rounded-xl sm:rounded-2xl pl-11 sm:pl-12 pr-4 sm:pr-5 text-sm font-bold outline-none focus:border-brand-gold transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Observações</label>
              <textarea 
                value={formData.observations}
                onChange={e => setFormData({...formData, observations: e.target.value})}
                className="w-full h-20 sm:h-24 bg-white border border-brand-ink/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-sm sm:text-base md:text-sm outline-none focus:border-brand-gold transition-colors resize-none"
                placeholder="Ex: Entrega de manhã..."
              />
            </div>
          </form>
        </div>

        <div className="p-5 sm:p-8 bg-white border-t border-brand-ink/5">
          <div className="flex items-center justify-between mb-4 sm:mb-6 px-1 sm:px-2">
            <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-brand-ink/40">Total do Pedido</span>
            <span className="text-xl sm:text-2xl font-serif font-bold text-brand-gold">{formatCurrency(total)}</span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isProcessing || isDone}
            className="w-full h-12 sm:h-16 bg-brand-ink text-white rounded-xl sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold">Processando...</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold">Pedido Enviado!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span className="uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold">Enviar pelo WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
