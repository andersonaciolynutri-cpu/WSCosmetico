import React, { useState, useRef, useEffect } from 'react';
import { Save, Smartphone, Building, Image as ImageIcon, Check, Upload, Trash2, Shield, Eye, EyeOff, Scissors, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { supabaseStorageService } from '../../services/supabaseStorageService';
import { adminAuth } from '../../utils/adminAuth';
import { validateImageType, fileToDataUrl, processLogoToSquare, dataUrlToBlob } from '../../utils/imageUpload';
import ImageEditorModal from '../../components/ImageEditorModal';
import { StoreSettings, AppSettings } from '../../types';

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAppSettings();
      setSettings(data);
      if (data?.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      const formData = new FormData(e.currentTarget);
      
      const newSettings: Partial<AppSettings> = {
        company_name: formData.get('companyName') as string,
        whatsapp_number: formData.get('whatsappNumber') as string,
        description: formData.get('description') as string,
        primary_color: formData.get('primaryColor') as string,
      };

      // Upload logo if changed
      if (logoPreview && logoPreview.startsWith('data:')) {
        // Process to square 1024x1024 before upload
        const squareLogoDataUrl = await processLogoToSquare(logoPreview, 1024);
        const blob = await dataUrlToBlob(squareLogoDataUrl);
        const file = new File([blob], 'logo.webp', { type: 'image/webp' });
        const uploadRes = await supabaseStorageService.uploadLogo(file);
        newSettings.logo_url = uploadRes.url;
        newSettings.logo_path = uploadRes.path;
      } else if (!logoPreview) {
        newSettings.logo_url = undefined;
        newSettings.logo_path = undefined;
      }

      const updated = await settingsService.updateAppSettings(newSettings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      window.dispatchEvent(new Event("ws_settings_updated"));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  const currentSettings = settings || { company_name: '', whatsapp_number: '', logo_url: '' };
  const currentLogo = logoPreview || (currentSettings as AppSettings).logo_url || '/logo.png';

  return (
    <div className="space-y-6 sm:space-y-10">
      <header>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-brand-ink">Configurações</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mt-1 sm:mt-2">Ajuste os dados básicos da sua distribuidora</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 border border-brand-ink/5 shadow-sm space-y-8 sm:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-5 h-5 text-brand-gold" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-ink">Dados da Empresa</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nome da Empresa</label>
                <input 
                  name="companyName"
                  required
                  defaultValue={settings?.company_name}
                  className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">WhatsApp de Vendas</label>
                <input 
                  name="whatsappNumber"
                  required
                  defaultValue={settings?.whatsapp_number}
                  placeholder="Ex: (21) 96697-2428"
                  className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Descrição / Slogan</label>
                <textarea 
                  name="description"
                  required
                  defaultValue={settings?.description}
                  className="w-full h-24 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-[2rem] p-4 sm:p-5 text-sm outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon className="w-5 h-5 text-brand-gold" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-ink">Logotipo e Visual</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Upload da Logo (PNG/JPG)</label>
                <div className="flex flex-col gap-4">
                  <div className="relative group overflow-hidden bg-brand-paper border-2 border-dashed border-brand-ink/10 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center transition-all hover:border-brand-gold/40">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-brand-ink/30 mb-2 group-hover:text-brand-gold group-hover:scale-110 transition-all" />
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 text-center">
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
                    defaultValue={settings?.primary_color || '#212121'}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-paper p-1 cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={settings?.primary_color || '#212121'}
                    readOnly
                    className="flex-1 h-11 sm:h-12 bg-brand-paper border border-transparent rounded-xl sm:rounded-2xl px-5 text-sm outline-none font-mono text-brand-ink/40"
                  />
                </div>
              </div>

              <div className="pt-4 sm:pt-6">
                <div className="p-6 sm:p-8 bg-brand-paper rounded-2xl sm:rounded-[2.5rem] border border-brand-ink/5 text-center shadow-inner">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl sm:rounded-[2rem] mx-auto mb-4 sm:mb-6 flex items-center justify-center p-4 sm:p-6 border border-brand-ink/5 shadow-md">
                    <img 
                      src={currentLogo} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/200x200?text=' + currentSettings.company_name;
                      }} 
                    />
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-3 sm:mb-4">Pré-visualização</p>
                  
                  {logoPreview && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button 
                        type="button"
                        onClick={() => {
                          if (logoPreview) {
                            setCurrentFileUrl(logoPreview);
                            setEditorOpen(true);
                          }
                        }}
                        className="flex items-center justify-center gap-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 transition-all p-2 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-brand-gold/20"
                      >
                        <Scissors className="w-3 h-3" /> Ajustar
                      </button>
                      <button 
                        type="button"
                        onClick={removeLogo}
                        className="flex items-center justify-center gap-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all p-2 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-red-100"
                      >
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 sm:pt-10 border-t border-brand-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="order-2 sm:order-1">
            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Salvo com sucesso!</span>
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 bg-brand-ink text-white rounded-xl sm:rounded-[2rem] flex items-center justify-center gap-3 sm:gap-4 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold disabled:opacity-50 order-1 sm:order-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 border border-brand-ink/5 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg sm:text-xl font-serif font-bold text-brand-ink">Acesso</h2>
        </div>
        <p className="text-xs sm:text-sm text-brand-ink/60 leading-relaxed">
          Autenticação via <strong>Supabase Auth</strong>. Para gerenciar usuários e senhas, utilize o dashboard do Supabase.
        </p>
      </div>

      <ImageEditorModal 
        open={editorOpen}
        imageSrc={currentFileUrl || ''}
        onClose={() => setEditorOpen(false)}
        onSave={handleEditorSave}
        title="Ajustar Logo da Empresa"
        aspect={1 / 1} // Aspect ratio for logos (Square)
      />
    </div>
  );
}
