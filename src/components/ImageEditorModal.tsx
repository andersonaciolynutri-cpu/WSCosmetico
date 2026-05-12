
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, RotateCw, Check, Loader2 } from 'lucide-react';
import { getCroppedImg, compressDataUrl } from '../utils/imageEditor';

interface ImageEditorModalProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onSave: (editedImageBase64: string) => void;
  aspect?: number;
  title?: string;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export default function ImageEditorModal({
  imageSrc,
  open,
  onClose,
  onSave,
  aspect = 1 / 1,
  title = 'Ajustar Imagem',
  outputType = 'image/jpeg'
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      // 1. Gera o corte
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        outputType
      );

      // 2. Comprime para garantir < 2MB
      const finalImage = await compressDataUrl(croppedImage, 2, outputType);

      onSave(finalImage);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ink p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-brand-ink/5 bg-white z-20">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-brand-ink truncate pr-4">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-brand-paper rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-brand-ink/40" />
          </button>
        </div>

        {/* Cropper area */}
        <div className="relative flex-1 bg-brand-paper min-h-[300px] sm:min-h-[450px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: 'bg-brand-paper',
              cropAreaClassName: 'border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]'
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 sm:p-8 space-y-6 bg-white border-t border-brand-ink/5 z-20">
          <div className="space-y-6">
            {/* Zoom */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
                  <ZoomIn className="w-3 h-3" /> Zoom
                </label>
                <span className="text-[10px] font-mono font-bold text-brand-gold">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-brand-paper rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
                  <RotateCw className="w-3 h-3" /> Rotação
                </label>
                <span className="text-[10px] font-mono font-bold text-brand-gold">{rotation}°</span>
              </div>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-2 bg-brand-paper rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-12 text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink border border-brand-ink/10 rounded-xl transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-[2] h-12 bg-brand-ink text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-lg shadow-brand-ink/10 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
