
import React from 'react';
import { User } from '@supabase/supabase-js';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: 'create' | 'enhance' | 'animate' | 'profile' | 'admin';
  setActiveTab: (tab: 'create' | 'enhance' | 'animate' | 'profile' | 'admin') => void;
  user?: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode, activeTab, setActiveTab, user }) => {
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'admin@pixelmind.com';

  const tabs = [
    { id: 'create', label: 'Criar' },
    { id: 'enhance', label: 'Melhorar' },
    { id: 'animate', label: 'Animar' },
    { id: 'profile', label: 'Perfil' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin' });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('create')}>
            <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-lg shadow-brand-purple/20 overflow-hidden">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col -space-y-1">
              <span className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
                PixelMind
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase px-0.5">Beta Experimental</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-brand-purple shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 p-1 pr-3 rounded-full border transition-all ${
                activeTab === 'profile' 
                  ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold overflow-hidden border border-slate-300 dark:border-slate-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand-purple">{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-bold hidden sm:inline whitespace-nowrap">
                {userName.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden flex h-12 border-t border-slate-200 dark:border-slate-800">
           {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center text-[10px] font-bold transition-all ${
                  activeTab === tab.id ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </button>
           ))}
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm mb-2">
            © {new Date().getFullYear()} PixelMind Labs. Versão Beta para validação e testes.
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Uso de Quota Gratuita &bull; Processamento Temporário &bull; Sem Custos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
