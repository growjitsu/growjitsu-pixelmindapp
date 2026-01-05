
import React, { useState, useRef, useEffect } from 'react';
import { animateImage } from '../services/geminiService';
import { AnimationConfig } from '../types';

interface ImageAnimatorProps {
  initialImage?: string | null;
}

const ImageAnimator: React.FC<ImageAnimatorProps> = ({ initialImage }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [intensity, setIntensity] = useState<'soft' | 'medium' | 'dynamic'>('medium');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [duration, setDuration] = useState<number>(5);
  
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsKeyReset, setNeedsKeyReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage) {
      setSelectedImage(initialImage);
    }
  }, [initialImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultVideo(null);
        setError(null);
        setNeedsKeyReset(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectNewKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setError(null);
      setNeedsKeyReset(false);
      // Após selecionar, o usuário pode tentar novamente
    }
  };

  const handleAnimate = async () => {
    if (!selectedImage) {
      setError('Por favor, carregue uma imagem para animar.');
      return;
    }
    if (!motionPrompt.trim()) {
      setError('Descreva como a imagem deve se mover.');
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsKeyReset(false);
    setResultVideo(null);
    setProgressMsg("Iniciando...");

    try {
      const videoUrl = await animateImage({
        image: selectedImage,
        mimeType,
        prompt: motionPrompt,
        aspectRatio,
        intensity,
        duration
      }, setProgressMsg);
      setResultVideo(videoUrl);
    } catch (err: any) {
      if (err.message.includes("CHAVE_INVALIDA")) {
        setError("A chave de API selecionada não tem permissão para usar o modelo Veo. Certifique-se de que o faturamento está ativo no Google Cloud.");
        setNeedsKeyReset(true);
      } else {
        setError(err.message || 'Houve um erro técnico ao processar seu vídeo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Coluna de Controles */}
      <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-purple/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold">PixelMind Animate</h2>
          </div>
          <span className="text-[10px] font-bold bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-md uppercase tracking-wider">Veo 3.1 Fast</span>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Imagem de Referência</label>
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`group cursor-pointer w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:border-brand-purple transition-all overflow-hidden relative ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4v12" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Clique para carregar</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={loading} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Direcionar Movimento</label>
          <textarea
            value={motionPrompt}
            onChange={(e) => setMotionPrompt(e.target.value)}
            disabled={loading}
            placeholder="Ex: O mar calmo deve ter ondas suaves quebrando na areia..."
            className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-purple outline-none transition-all resize-none text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duração Desejada</label>
              <span className="text-xs font-bold text-brand-purple">{duration}s</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="10" 
              step="1" 
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={loading}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-purple disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
              <span>2s</span>
              <span>10s</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Formato</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-purple"
              >
                <option value="9:16">Vertical (TikTok)</option>
                <option value="16:9">Horizontal (YouTube)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Vigor</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as any)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-purple"
              >
                <option value="soft">Sutil</option>
                <option value="medium">Equilibrado</option>
                <option value="dynamic">Vibrante</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-100 dark:border-red-900/50 space-y-3">
            <p className="font-medium">{error}</p>
            {needsKeyReset && (
              <button 
                onClick={handleSelectNewKey}
                className="w-full py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Selecionar Outra Chave de API
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleAnimate}
          disabled={loading || !selectedImage}
          className={`w-full py-4 rounded-2xl font-display font-bold text-white transition-all flex items-center justify-center gap-3 shadow-lg ${
            loading || !selectedImage
              ? 'bg-slate-400 cursor-not-allowed' 
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dar Vida à Imagem
            </>
          )}
        </button>
      </div>

      {/* Coluna de Resultado */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[640px] bg-slate-100 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 transition-colors relative overflow-hidden">
        {!resultVideo && !loading && (
          <div className="text-center p-12">
            <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">Laboratório de Animação</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-3">Sua imagem ganhará movimento cinematográfico aqui em poucos minutos.</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10 px-8 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-brand-purple/10 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="font-display font-bold text-brand-purple text-2xl animate-pulse tracking-tight">{progressMsg}</p>
            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-brand-blue/10 rounded-full">
               <span className="w-2 h-2 bg-brand-blue rounded-full animate-ping"></span>
               <span className="text-[10px] text-brand-blue font-bold uppercase tracking-widest">Gemini Veo 3.1 Pro Ativo</span>
            </div>
          </div>
        )}

        {resultVideo && (
          <div className={`w-full h-full flex flex-col items-center justify-center p-6 ${aspectRatio === '9:16' ? 'max-w-[360px] mx-auto' : 'w-full max-w-5xl'}`}>
             <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl bg-black group border border-slate-200 dark:border-slate-800">
                <video 
                  src={resultVideo} 
                  autoPlay 
                  loop 
                  playsInline 
                  controls
                  className="w-full h-auto max-h-[70vh] block"
                />
                
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={resultVideo} 
                    download={`pixelmind-animate-${Date.now()}.mp4`}
                    className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-transform"
                    title="Salvar Vídeo"
                  >
                    <svg className="w-7 h-7 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
             </div>
             
             <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
                <button 
                  onClick={() => handleAnimate()}
                  className="px-8 py-3.5 text-sm font-bold bg-slate-200 dark:bg-slate-700 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                >
                  Regerar Animação
                </button>
                <a 
                  href={resultVideo} 
                  download 
                  className="px-10 py-3.5 text-sm font-bold bg-brand-purple text-white rounded-2xl hover:shadow-xl hover:shadow-brand-purple/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar MP4
                </a>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnimator;
