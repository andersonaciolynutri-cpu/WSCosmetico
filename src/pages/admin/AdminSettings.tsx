import React, { useState, useRef } from 'react';
import { Save, Smartphone, Building, Image as ImageIcon, Check, Upload, Trash2, Shield, Eye, EyeOff, Scissors } from 'lucide-react';
import { storageService } from '../../storageService';
import { adminAuth } from '../../utils/adminAuth';
import { validateImageType, fileToDataUrl } from '../../utils/imageUpload';
import ImageEditorModal from '../../components/ImageEditorModal';
import { StoreSettings } from '../../types';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>(storageService.getSettings());
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoDataUrl || settings.logoUrl || null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageType(file);
    if (error) {
      alert(error);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCurrentFileUrl(dataUrl);
      setEditorOpen(true);
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      alert('Erro ao carregar a imagem.');
    }
  };

  const handleEditorSave = (finalImage: string) => {
    setLogoPreview(finalImage);
    setEditorOpen(false);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      adminAuth.updateAdminPassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      if (error instanceof Error) {
        setPasswordError(error.message);
      } else {
        setPasswordError('Erro ao alterar senha.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSettings: StoreSettings = {
      companyName: formData.get('companyName') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
      logoDataUrl: logoPreview || undefined,
      logoUrl: (formData.get('logoUrl') as string) || undefined,
      description: formData.get('description') as string,
      primaryColor: formData.get('primaryColor') as string,
    };

    storageService.saveSettings(newSettings);
    setSettings(newSettings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const currentLogo = logoPreview || settings.logoUrl || '/logo.png';

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-serif font-bold text-brand-ink">Configurações</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mt-2">Ajuste os dados básicos da sua distribuidora</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 border border-brand-ink/5 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-5 h-5 text-brand-gold" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-brand-ink">Dados da Empresa</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nome da Empresa</label>
                <input 
                  name="companyName"
                  required
                  defaultValue={settings.companyName}
                  className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">WhatsApp de Vendas</label>
                <input 
                  name="whatsappNumber"
                  required
                  defaultValue={settings.whatsappNumber}
                  placeholder="Ex: (21) 96697-2428"
                  className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Descrição / Slogan</label>
                <textarea 
                  name="description"
                  required
                  defaultValue={settings.description}
                  className="w-full h-24 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-[2rem] p-5 text-sm outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon className="w-5 h-5 text-brand-gold" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-brand-ink">Logotipo e Visual</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Upload da Logo (PNG/JPG)</label>
                <div className="flex flex-col gap-4">
                  <div className="relative group overflow-hidden bg-brand-paper border-2 border-dashed border-brand-ink/10 rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all hover:border-brand-gold/40">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-8 h-8 text-brand-ink/30 mb-2 group-hover:text-brand-gold group-hover:scale-110 transition-all" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
                      Arraste ou clique para enviar
                    </p>
                    <p className="text-[8px] uppercase tracking-widest text-brand-ink/20 mt-1">Logo ajustável e otimizada</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Cores (Cor Principal)</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color"
                    name="primaryColor"
                    defaultValue={settings.primaryColor}
                    className="w-12 h-12 rounded-xl bg-brand-paper p-1 cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={settings.primaryColor}
                    readOnly
                    className="flex-1 h-12 bg-brand-paper border border-transparent rounded-2xl px-5 text-sm outline-none font-mono text-brand-ink/40"
                  />
                </div>
              </div>

              <div className="pt-6">
                <div className="p-8 bg-brand-paper rounded-[2.5rem] border border-brand-ink/5 text-center shadow-inner">
                  <div className="w-32 h-32 bg-white rounded-[2rem] mx-auto mb-6 flex items-center justify-center p-6 border border-brand-ink/5 shadow-md">
                    <img 
                      src={currentLogo} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/200x200?text=' + settings.companyName;
                      }} 
                    />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-4">Pré-visualização da Logo</p>
                  
                  {logoPreview && (
                    <div className="flex gap-3 justify-center">
                      <button 
                        type="button"
                        onClick={() => {
                          if (logoPreview) {
                            setCurrentFileUrl(logoPreview);
                            setEditorOpen(true);
                          }
                        }}
                        className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 transition-all p-2 px-4 rounded-xl border border-brand-gold/20"
                      >
                        <Scissors className="w-3 h-3" />
                        Ajustar
                      </button>
                      <button 
                        type="button"
                        onClick={removeLogo}
                        className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all p-2 px-4 rounded-xl border border-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-brand-ink/5 flex items-center justify-between">
          <div>
            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Configurações salvas com sucesso!</span>
              </div>
            )}
          </div>
          <button 
            type="submit"
            className="h-16 px-12 bg-brand-ink text-white rounded-[2rem] flex items-center justify-center gap-4 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group uppercase text-xs tracking-[0.2em] font-bold"
          >
            <Save className="w-5 h-5" />
            Salvar Alterações
          </button>
        </div>
      </form>

      {/* Seção de Segurança */}
      <div className="bg-white rounded-[3rem] p-10 border border-brand-ink/5 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-gold" />
          <h2 className="text-xl font-serif font-bold text-brand-ink">Segurança do Admin</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Senha Atual</label>
            <div className="relative group">
              <input 
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 pr-12 text-sm outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/20 hover:text-brand-ink transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nova Senha</label>
            <div className="relative group">
              <input 
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 pr-12 text-sm outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/20 hover:text-brand-ink transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Confirmar Nova Senha</label>
            <div className="relative group">
              <input 
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 pr-12 text-sm outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/20 hover:text-brand-ink transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
            <div className="flex-1">
              {passwordError && <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest">{passwordError}</p>}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Senha alterada com sucesso!</span>
                </div>
              )}
            </div>
            <button 
              type="submit"
              className="h-12 px-8 bg-brand-ink text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-lg shadow-brand-ink/10"
            >
              <Shield className="w-4 h-4" />
              Alterar Senha
            </button>
          </div>
        </form>
      </div>
      <ImageEditorModal 
        open={editorOpen}
        imageSrc={currentFileUrl || ''}
        onClose={() => setEditorOpen(false)}
        onSave={handleEditorSave}
        title="Ajustar Logo da Empresa"
        aspect={3 / 1} // Aspect ratio for logos (wider)
      />
    </div>
  );
}
