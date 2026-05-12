import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { storageService } from '../../storageService';
import { adminAuth } from '../../utils/adminAuth';
import { cn } from '../../lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!adminAuth.isAdminLoggedIn()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    adminAuth.logoutAdmin();
    navigate('/admin');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Produtos', path: '/admin/produtos' },
    { icon: SettingsIcon, label: 'Configurações', path: '/admin/configuracoes' },
  ];

  const settings = storageService.getSettings();

  return (
    <div className="min-h-screen bg-brand-paper flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-brand-ink text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={settings.logoDataUrl || settings.logoUrl || '/logo.png'} 
              className="w-full h-full object-contain" 
              alt="" 
              onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + settings.companyName} 
            />
          </div>
          <span className="font-serif font-bold text-lg tracking-tight truncate">{settings.companyName}</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                  isActive 
                    ? "bg-brand-gold text-brand-ink" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Ver Catálogo
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
