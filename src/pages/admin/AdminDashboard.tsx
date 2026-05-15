import React, { useState, useEffect } from 'react';
import { Package, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { productService } from '../../services/productService';
import { settingsService } from '../../services/settingsService';
import { Product, AppSettings } from '../../types';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [p, s] = await Promise.all([
          productService.getAllProducts(),
          settingsService.getAppSettings()
        ]);
        setProducts(p);
        setSettings(s);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  const stats = [
    { label: 'Total de Produtos', value: products.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Produtos Ativos', value: products.filter(p => p.active).length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Produtos Inativos', value: products.filter(p => !p.active).length, icon: XCircle, color: 'bg-red-500' },
    { label: 'WhatsApp Atual', value: settings.whatsapp_number, icon: Smartphone, color: 'bg-brand-gold' },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      <header>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-brand-ink">Painel de Controle</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mt-1 sm:mt-2">Visão geral do seu catálogo</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-brand-ink/5 hover:shadow-xl hover:shadow-brand-ink/5 transition-all">
            <div className={stat.color + " w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6"}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-brand-ink truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 border border-brand-ink/5">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-brand-ink mb-4 sm:mb-6">Informações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Empresa Configurada</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-[2rem] bg-brand-paper border border-brand-ink/5 overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={settings.logo_url || '/logo.png'} 
                  alt="" 
                  className="w-full h-full object-contain" 
                  onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + settings.company_name} 
                />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-serif font-bold text-brand-ink truncate">{settings.company_name}</p>
                <p className="text-xs sm:text-sm text-brand-ink/60 truncate">Canal: {settings.whatsapp_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
