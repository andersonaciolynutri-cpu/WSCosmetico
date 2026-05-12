import React from 'react';
import { Package, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { storageService } from '../../storageService';

export default function AdminDashboard() {
  const products = storageService.getProducts();
  const settings = storageService.getSettings();

  const stats = [
    { label: 'Total de Produtos', value: products.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Produtos Ativos', value: products.filter(p => p.active).length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Produtos Inativos', value: products.filter(p => !p.active).length, icon: XCircle, color: 'bg-red-500' },
    { label: 'WhatsApp Atual', value: settings.whatsappNumber, icon: Smartphone, color: 'bg-brand-gold' },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-serif font-bold text-brand-ink">Bem-vindo, Admin!</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mt-2">Visão geral do sistema</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-ink/5 hover:shadow-xl hover:shadow-brand-ink/5 transition-all">
            <div className={stat.color + " w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6"}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-1">{stat.label}</p>
            <p className="text-2xl font-serif font-bold text-brand-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-brand-ink/5">
        <h2 className="text-2xl font-serif font-bold text-brand-ink mb-6">Informações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Empresa</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[2rem] bg-brand-paper border border-brand-ink/5 overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={settings.logoDataUrl || settings.logoUrl || '/logo.png'} 
                  alt="" 
                  className="w-full h-full object-contain" 
                  onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + settings.companyName} 
                />
              </div>
              <div>
                <p className="text-lg font-serif font-bold text-brand-ink">{settings.companyName}</p>
                <p className="text-sm text-brand-ink/60">{settings.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
