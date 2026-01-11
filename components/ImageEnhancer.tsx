
import React, { useState, useRef, useEffect } from 'react';
import { enhanceImage } from '../services/geminiService';
import { getQuotaStatus } from '../services/usageService';
import { EnhancementConfig } from '../types';
import { supabase } from '../lib/supabase';

interface ImageEnhancerProps {
  onAnimateRequested?: (imageUrl: string) => void;
}

const ImageEnhancer: React.FC<ImageEnhancerProps> = ({ onAnimateRequested }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ remaining: number, limit: number } | null>(null);

  const [config, setConfig] = useState<EnhancementConfig>({
    upscale: true,
    sharpen: true,
    denoise: false,
    colorAdjust: true,
    faceEnhance: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuota = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const status = await getQuotaStatus(session.user.id, 'image');
      setQuotaInfo({ remaining: status.remaining, limit: status.limit });
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 5MB.');
        return;
      }
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!selectedImage) {
      setError('Por favor, faça upload de uma imagem primeiro.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const enhancedUrl = await enhanceImage(selectedImage, mimeType, config);
      setResult(enhancedUrl);
      await fetchQuota();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar a imagem.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isQuotaExhausted = quotaInfo !== null && quotaInfo.remaining === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        
        {/* Quota Indicator */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isQuotaExhausted ? 'bg-red-500' : 'bg-brand-purple animate-pulse'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Saldo de Processamento</span>
           </div>
           <span className={`text-xs font-black ${isQuotaExhausted ? 'text-red-500' : 'text-brand-purple'}`}>
             {quotaInfo ? `${quotaInfo.remaining} / ${quotaInfo.limit}` : '...'}
           </span>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
            Upload da Imagem
          </label>
          <div 
            onClick={() => !loading && !isQuotaExhausted && fileInputRef.current?.click()}
            className={`group cursor-pointer w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-brand-purple transition-all overflow-hidden relative ${loading || isQuotaExhausted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="text-center">
                <span className="text-sm font-medium text-slate-500">Clique para selecionar</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={loading || isQuotaExhausted} />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {isQuotaExhausted && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium text-center">
             Você atingiu o limite de processamento diário.
          </div>
        )}

        <button
          onClick={handleEnhance}
          disabled={loading || !selectedImage || isQuotaExhausted}
          className={`w-full py-4 rounded-xl font-display font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
            loading || !selectedImage || isQuotaExhausted
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 active:scale-95 shadow-brand-purple/20'
          }`}
        >
          {loading ? 'Melhorando...' : (isQuotaExhausted ? 'Limite Diário Atingido' : 'Melhorar Imagem')}
        </button>
      </div>

      <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 transition-colors relative overflow-hidden">
        {/* Comparison and result logic stays as is */}
        {result ? (
           <img src={compareMode ? selectedImage! : result} className="max-w-full max-h-[500px] rounded-xl shadow-2xl" />
        ) : (
           selectedImage && <img src={selectedImage} className="max-w-full max-h-[500px] rounded-xl shadow-2xl opacity-80" />
        )}
      </div>
    </div>
  );
};

export default ImageEnhancer;
