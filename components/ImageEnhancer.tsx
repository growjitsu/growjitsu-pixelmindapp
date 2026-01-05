
import React, { useState, useRef } from 'react';
import { enhanceImage } from '../services/geminiService';
import { EnhancementConfig } from '../types';

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

  const [config, setConfig] = useState<EnhancementConfig>({
    upscale: true,
    sharpen: true,
    denoise: false,
    colorAdjust: true,
    faceEnhance: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const toggleOption = (key: keyof EnhancementConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
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
    } catch (err: any) {
      setError('Ocorreu um erro ao processar a imagem. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `pixelmind-enhanced-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
            Upload da Imagem
          </label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-brand-purple transition-all overflow-hidden relative"
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-70" />
            ) : (
              <>
                <div className="p-3 bg-brand-purple/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-500">Clique para selecionar</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG ou WEBP (Max 5MB)</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            {selectedImage && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <span className="text-white text-sm font-medium">Trocar Imagem</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
            Opções de Melhoria
          </label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'upscale', label: 'Aumentar Resolução (Upscale)', icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' },
              { id: 'sharpen', label: 'Nitidez e Detalhes', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { id: 'denoise', label: 'Remover Ruído', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16v4m-2-2h4m5 16v4m-2-2h4' },
              { id: 'colorAdjust', label: 'Ajuste de Cor e Luz', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' },
              { id: 'faceEnhance', label: 'Melhoria Facial AI', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id as keyof EnhancementConfig)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  config[option.id as keyof EnhancementConfig]
                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                </svg>
                <span className="text-sm font-medium">{option.label}</span>
                {config[option.id as keyof EnhancementConfig] && (
                  <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <button
          onClick={handleEnhance}
          disabled={loading || !selectedImage}
          className={`w-full py-4 rounded-xl font-display font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
            loading || !selectedImage
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 active:scale-95 shadow-brand-purple/20'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16v4m-2-2h4m5 16v4m-2-2h4" />
              </svg>
              Melhorar Imagem
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 transition-colors relative overflow-hidden">
        {!selectedImage && !result && !loading && (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Arraste uma foto aqui</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Corrija iluminação, remova ruído e melhore a nitidez de suas fotos antigas ou desfocadas.</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 font-display font-medium text-brand-purple">Refinando cada pixel para você...</p>
          </div>
        )}

        {(selectedImage || result) && (
          <div className="w-full h-full p-4 flex flex-col items-center relative group">
            <div className="w-full h-full relative flex items-center justify-center">
              {result ? (
                <div className="relative w-full h-full flex items-center justify-center group/view">
                  <div className="relative flex items-center justify-center">
                    <img 
                      src={compareMode ? selectedImage! : result} 
                      alt="Result" 
                      className="max-w-full max-h-[500px] rounded-xl shadow-2xl transition-all"
                    />
                    
                    {/* Comparison Button */}
                    <button
                      onMouseDown={() => setCompareMode(true)}
                      onMouseUp={() => setCompareMode(false)}
                      onTouchStart={() => setCompareMode(true)}
                      onTouchEnd={() => setCompareMode(false)}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur text-white text-xs font-bold rounded-full select-none shadow-xl border border-white/20"
                    >
                      {compareMode ? 'SOLTE PARA VER O DEPOIS' : 'SEGURE PARA VER O ANTES'}
                    </button>
                  </div>
                </div>
              ) : (
                <img 
                  src={selectedImage!} 
                  alt="Original" 
                  className="max-w-full max-h-[500px] rounded-xl shadow-2xl opacity-80"
                />
              )}

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {result && onAnimateRequested && (
                  <button
                    onClick={() => onAnimateRequested(result)}
                    className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg hover:scale-110 active:scale-90"
                    title="Animar"
                  >
                    <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
                {result && (
                  <button
                    onClick={downloadImage}
                    className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg hover:scale-110 active:scale-90"
                    title="Download Result"
                  >
                    <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {result && (
              <div className="mt-4 w-full flex justify-between items-center px-2">
                <span className="text-xs text-slate-500 font-medium">Imagem Melhorada por PixelMind</span>
                <div className="flex gap-4">
                  {onAnimateRequested && (
                    <button 
                      onClick={() => onAnimateRequested(result)}
                      className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Animar Esta Imagem
                    </button>
                  )}
                  <button 
                    onClick={downloadImage}
                    className="text-sm font-semibold text-brand-purple hover:underline"
                  >
                    Baixar PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEnhancer;
