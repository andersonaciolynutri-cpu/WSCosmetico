import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronLeft,
  Loader2,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { adminAuth } from '../../utils/adminAuth';
import { settingsService } from '../../services/settingsService';
import { cn } from '../../lib/utils';
import { AppSettings } from '../../types';
import ErrorBoundary from '../../components/ErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const isAdmin = await adminAuth.isAdmin();
        if (!isAdmin) {
          navigate('/admin');
          return;
        }

        const data = await settingsService.getAppSettings();
        setSettings(data);
      } catch (err) {
        console.error('Erro ao verificar autenticação no layout:', err);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    // Close sidebar on route change
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await adminAuth.logout();
    navigate('/admin');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Produtos', path: '/admin/produtos' },
    { icon: SettingsIcon, label: 'Configurações', path: '/admin/configuracoes' },
  ];

  const companyName = settings?.company_name || 'WS Cosméticos';
  const logoUrl = settings?.logo_url || '/logo.png';

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper flex flex-col md:flex-row relative">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-brand-ink text-white px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 truncate pr-4">
          <img 
            src={logoUrl} 
            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" 
            alt="" 
            onError={e => e.currentTarget.src = 'https://placehold.co/50x50?text=WS'} 
          />
          <span className="font-serif font-bold text-sm truncate">{companyName}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white/10 rounded-lg"
        >
          {isSidebarOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-64 bg-brand-ink text-white p-6 flex flex-col shrink-0 z-50 transition-transform duration-300 md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={logoUrl} 
              className="logo" 
              alt="" 
              onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=' + companyName} 
            />
          </div>
          <span className="font-serif font-bold text-lg tracking-tight truncate">{companyName}</span>
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
                  "flex items-center gap-3 px-4 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
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

        <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Catálogo
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
