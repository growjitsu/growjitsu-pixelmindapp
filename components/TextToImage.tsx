
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GenerationConfig, ImageStyle, AspectRatio } from '../types';

interface TextToImageProps {
  onAnimateRequested?: (imageUrl: string) => void;
}

const TextToImage: React.FC<TextToImageProps> = ({ onAnimateRequested }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('realistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, insira um comando de texto.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage({ prompt, style, aspectRatio });
      setResult(imageUrl);
    } catch (err: any) {
      setError('Ocorreu um erro ao gerar a imagem. Verifique sua chave de API e tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `pixelmind-gen-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Descrição da Imagem
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Um astronauta andando em um campo de lavanda no planeta Marte..."
            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Estilo
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ImageStyle)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple outline-none"
            >
              <option value="realistic">Realista</option>
              <option value="artistic">Artístico</option>
              <option value="anime">Anime</option>
              <option value="cartoon">Cartoon</option>
              <option value="professional">Profissional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Proporção
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple outline-none"
            >
              <option value="1:1">1:1 (Feed)</option>
              <option value="4:5">4:5 (Instagram)</option>
              <option value="9:16">9:16 (Reels/TikTok)</option>
              <option value="16:9">16:9 (Cinema)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-4 rounded-xl font-display font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
            loading 
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
              Gerando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Gerar Imagem
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 transition-colors relative overflow-hidden">
        {!result && !loading && (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Sua criação aparecerá aqui</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Descreva sua ideia, escolha um estilo e clique em gerar para ver a mágica acontecer.</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 bg-brand-purple rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-4 font-display font-medium text-brand-purple">A IA está sonhando com sua imagem...</p>
          </div>
        )}

        {result && (
          <div className="w-full h-full p-4 flex flex-col items-center group">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={result} 
                alt="Generated" 
                className={`max-w-full max-h-full rounded-xl shadow-2xl transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
              />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onAnimateRequested && (
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
                <button
                  onClick={downloadImage}
                  className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full shadow-lg hover:scale-110 active:scale-90"
                  title="Download"
                >
                  <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-4 w-full flex justify-between items-center px-2">
              <span className="text-xs text-slate-500 font-medium">Gerado com PixelMind AI</span>
              <div className="flex gap-4">
                 {onAnimateRequested && (
                   <button 
                    onClick={() => onAnimateRequested(result)}
                    className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Dar Vida
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TextToImage;
