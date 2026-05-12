import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { storageService } from '../../storageService';
import { adminAuth } from '../../utils/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const settings = storageService.getSettings();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuth.validateAdminPassword(password)) {
      adminAuth.loginAdmin();
      navigate('/admin/dashboard');
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl shadow-brand-ink/10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-brand-ink/10 overflow-hidden p-4 border border-brand-ink/5">
            <img 
              src={settings.logoDataUrl || settings.logoUrl || '/logo.png'} 
              alt="" 
              className="w-full h-full object-contain"
              onError={e => e.currentTarget.src = 'https://placehold.co/200x200?text=' + settings.companyName}
            />
          </div>
          <h2 className="text-3xl font-serif font-bold text-brand-ink mb-2">Painel Admin</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">{settings.companyName}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Senha de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full h-14 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-brand-ink text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group uppercase text-xs tracking-[0.2em] font-bold"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
