import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react';
import { adminAuth } from '../../utils/adminAuth';
import { settingsService } from '../../services/settingsService';
import { AppSettings } from '../../types';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAdmin = await adminAuth.isAdmin();
        if (isAdmin) {
          navigate('/admin/dashboard');
          return;
        }
        const data = await settingsService.getAppSettings();
        setSettings(data);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    try {
      setIsLoggingIn(true);
      setError('');
      await adminAuth.login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Erro no login:', err);
      if (err.message?.includes('invalid_credentials')) {
        setError('E-mail ou senha inválidos.');
      } else {
        setError(err.message || 'Erro ao realizar login.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const companyName = settings?.company_name || "WS Cosméticos";
  const logoUrl = settings?.logo_url || "/logo.png";

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl shadow-brand-ink/10">
        <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-brand-ink/10 overflow-hidden p-3 sm:p-4 border border-brand-ink/5">
            <img 
              src={logoUrl} 
              alt="" 
              className="logo"
              onError={e => e.currentTarget.src = 'https://placehold.co/200x200?text=' + companyName}
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-ink mb-1 sm:mb-2">Painel Admin</h2>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-ink/40">{companyName}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">E-mail de Acesso</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold" />
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                className="w-full h-14 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Senha de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full h-14 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-14 bg-brand-ink text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group uppercase text-xs tracking-[0.2em] font-bold disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
