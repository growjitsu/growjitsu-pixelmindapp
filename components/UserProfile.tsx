
import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o estado local sempre que o objeto 'user' do Supabase for atualizado
  // Isso resolve o problema de não conseguir editar pela segunda vez devido a dados obsoletos
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setPhone(user.user_metadata?.phone || '');
      setInstagram(user.user_metadata?.instagram || '');
      setAvatar(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const email = user.email || '';
  const createdAt = new Date(user.created_at).toLocaleDateString('pt-BR');

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new CustomEvent('pixelmind-auth-event', { detail: 'LOGOUT' }));
      await supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.error('Logout error');
    } finally {
      setLogoutLoading(false);
    }
  };

  // Comprime o avatar para evitar erro 413 (Payload Too Large) nos metadados do Supabase
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setAvatar(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // 1. O passo crucial: Atualiza a sessão antes de salvar. 
      // Isso renova o token JWT e evita erros de "permissão negada" em edições consecutivas.
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !session) throw new Error("Sessão expirada. Faça login novamente.");

      // 2. Salva os novos dados
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          instagram: instagram,
          avatar_url: avatar
        }
      });

      if (error) throw error;
      
      alert('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      if (err.message === 'Failed to fetch') {
        alert('Erro de Conexão: O banco de dados não respondeu. Tente desativar AdBlockers.');
      } else {
        alert('Não foi possível salvar: ' + (err.message || 'Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="h-32 bg-gradient-to-r from-brand-purple to-brand-blue opacity-80"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6 flex justify-between items-end">
            <div className="relative">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-lg">
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-600 overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-display font-bold text-brand-purple">
                      {(fullName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-purple text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="mb-2 px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all"
              >
                Editar Perfil
              </button>
            )}
          </div>

          <div className="space-y-6 text-left">
            {isEditing ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Nome Completo</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-purple transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">E-mail</label>
                    <input 
                      type="text" 
                      value={email}
                      disabled
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Telefone</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-purple transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Instagram</label>
                    <input 
                      type="text" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@usuario"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-purple transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex-1 py-3 bg-brand-purple text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">
                    {fullName || 'Usuário PixelMind'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Telefone</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {phone || 'Não informado'}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Instagram</span>
                    <span className="text-sm font-semibold text-brand-purple">
                      {instagram ? `@${instagram}` : 'Não informado'}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Membro Desde</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{createdAt}</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-all hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  {logoutLoading ? 'Saindo...' : 'Sair da Conta'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
