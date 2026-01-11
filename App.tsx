
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TextToImage from './components/TextToImage';
import ImageEnhancer from './components/ImageEnhancer';
import ImageAnimator from './components/ImageAnimator';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'enhance' | 'animate' | 'profile' | 'admin'>('create');
  const [sharedImage, setSharedImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Verificação de Admin baseada em E-mail ou Metadados do Supabase
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'admin@pixelmind.com';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
    } else {
      setDarkMode(true);
    }

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (err: any) {
        console.warn("Supabase session check failed:", err.message);
        // Só exibe erro de conexão se não for um cancelamento normal
        if (err.message !== 'Failed to fetch' && !err.message.includes('Aborted')) {
          setConnectionError(true);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    // Listener para eventos de autenticação
    const handleManualAuth = (e: any) => {
      if (e.detail === 'LOGOUT') {
        setUser(null);
        setActiveTab('create');
      }
    };
    window.addEventListener('pixelmind-auth-event', handleManualAuth);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveTab('create');
      } else if (['SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        setUser(session?.user ?? null);
      }
      
      if (session?.user) setConnectionError(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pixelmind-auth-event', handleManualAuth);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleAnimateFromOtherTab = (imageUrl: string) => {
    setSharedImage(imageUrl);
    setActiveTab('animate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Se estiver carregando auth, exibe splash screen para evitar flash de conteúdo
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light dark:bg-brand-dark transition-colors">
        <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-medium tracking-widest uppercase animate-pulse">Iniciando PixelMind...</p>
      </div>
    );
  }

  // Se não houver usuário, exibe a tela de Auth
  if (!user) {
    return <Auth />;
  }

  // Renderização principal protegida
  return (
    <Layout 
      darkMode={darkMode} 
      toggleDarkMode={() => setDarkMode(!darkMode)}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {connectionError && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-400 text-sm flex items-center gap-3 animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Instabilidade na conexão. Algumas funções podem não salvar corretamente.</span>
          </div>
        )}

        {activeTab !== 'profile' && activeTab !== 'admin' && (
          <section className="text-center space-y-4 pt-4 lg:pt-10 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Bem-vindo, {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">ADMIN</span>
              )}
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight">
              A Próxima Era da <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">Criatividade Visual</span>
            </h1>
          </section>
        )}

        <div className="mt-8 transition-all duration-300 min-h-[400px]">
          {activeTab === 'create' && <TextToImage onAnimateRequested={handleAnimateFromOtherTab} />}
          {activeTab === 'enhance' && <ImageEnhancer onAnimateRequested={handleAnimateFromOtherTab} />}
          {activeTab === 'animate' && <ImageAnimator initialImage={sharedImage} />}
          {activeTab === 'profile' && <UserProfile user={user} />}
          {activeTab === 'admin' && isAdmin && <AdminDashboard />}
          
          {/* Fallback para abas não autorizadas */}
          {activeTab === 'admin' && !isAdmin && (
            <div className="text-center py-20 animate-fadeIn">
              <p className="text-slate-500">Você não tem permissão para acessar esta área.</p>
              <button onClick={() => setActiveTab('create')} className="mt-4 text-brand-purple font-bold">Voltar ao Início</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
