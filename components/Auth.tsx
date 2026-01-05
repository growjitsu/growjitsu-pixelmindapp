
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Validação em tempo real das senhas
  useEffect(() => {
    if (!isLogin && confirmPassword !== '') {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Verificação extra de segurança para o cadastro
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('As senhas digitadas não são iguais.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      
      // Tratamento específico para o erro de rede (Failed to fetch)
      // Isso ocorre geralmente se a URL do Supabase estiver errada ou se houver um AdBlocker barrando a requisição.
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Erro de conexão: O servidor Supabase não pôde ser alcançado. Isso pode ocorrer por: 1) URL incorreta em lib/supabase.ts, 2) Bloqueio por extensões (como AdBlockers) ou 3) Falha no seu provedor de internet.');
      } else {
        setError(err.message || 'Ocorreu um erro inesperado na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage('E-mail de recuperação enviado com sucesso.');
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'Erro de rede: Não foi possível enviar o e-mail.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-brand-dark">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="p-8 text-center bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-purple/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-white">
              PixelMind
            </h1>
            <p className="text-slate-500 text-sm mt-1">A sua jornada criativa começa aqui.</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all text-sm"
                    placeholder="João Silva"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all text-sm"
                  placeholder="exemplo@email.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${!passwordsMatch && !isLogin ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all text-sm`}
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${!passwordsMatch ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all text-sm`}
                    placeholder="••••••••"
                  />
                  {!passwordsMatch && (
                    <span className="text-[10px] text-red-500 font-bold ml-1 uppercase tracking-tighter">As senhas não coincidem</span>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900/50 leading-relaxed">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!passwordsMatch && !isLogin)}
                className={`w-full py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white font-display font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all flex items-center justify-center gap-2 ${loading || (!passwordsMatch && !isLogin) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-4">
              {isLogin && (
                <button
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-slate-500 hover:text-brand-purple transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}</span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-brand-purple hover:underline"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest font-bold">
          Versão Beta &bull; Acesso Gratuito
        </p>
      </div>
    </div>
  );
};

export default Auth;
