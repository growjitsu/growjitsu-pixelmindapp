
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminUser, AdminStats, UserStatus, PlanType } from '../types';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    payingUsers: 0,
    totalImages: 0,
    totalAnimations: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // MOCK DATA PARA DEMONSTRAÇÃO (fallback caso o banco esteja vazio)
  const loadData = async () => {
    setLoading(true);
    try {
      // Em produção, aqui buscaríamos das tabelas reais:
      // const { data: usersData } = await supabase.from('profiles').select('*');
      
      // Simulando dados para o dashboard
      const mockUsers: AdminUser[] = [
        {
          id: '1',
          full_name: 'Admin Principal',
          email: 'admin@pixelmind.com',
          status: 'active',
          plan: 'pro_monthly',
          created_at: '2023-10-01',
          expires_at: '2024-12-31',
          last_login: '2024-05-20',
          usage: { images: 154, enhancements: 42, animations: 12 }
        },
        {
          id: '2',
          full_name: 'João Silva',
          email: 'joao@email.com',
          status: 'trial',
          plan: 'trial',
          created_at: '2024-05-15',
          expires_at: '2024-05-22',
          last_login: '2024-05-19',
          usage: { images: 12, enhancements: 5, animations: 1 }
        },
        {
          id: '3',
          full_name: 'Maria Santos',
          email: 'maria@web.com',
          status: 'expired',
          plan: 'free',
          created_at: '2024-01-10',
          expires_at: '2024-02-10',
          last_login: '2024-02-15',
          usage: { images: 45, enhancements: 10, animations: 0 }
        }
      ];

      setUsers(mockUsers);
      setStats({
        totalUsers: 1240,
        activeUsers: 850,
        trialUsers: 120,
        payingUsers: 270,
        totalImages: 15420,
        totalAnimations: 840
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (userId: string, action: string) => {
    alert(`Ação "${action}" para o usuário ${userId} realizada com sucesso!`);
    // Aqui seria feita a chamada ao Supabase para atualizar o status/metadados
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Admin Dashboard</h2>
          <p className="text-slate-500">Gestão de usuários, pagamentos e métricas da plataforma.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar Dados
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Usuários" value={stats.totalUsers} icon="users" color="purple" />
        <StatCard title="Ativos Hoje" value={stats.activeUsers} icon="active" color="emerald" />
        <StatCard title="Pagantes" value={stats.payingUsers} icon="card" color="blue" />
        <StatCard title="Imagens Geradas" value={stats.totalImages} icon="image" color="amber" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="text-lg font-bold">Gestão de Usuários</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="trial">Em Teste</option>
              <option value="expired">Expirados</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Status / Plano</th>
                <th className="px-6 py-4">Expiração</th>
                <th className="px-6 py-4 text-center">Uso (Img/Video)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{user.full_name}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={user.status} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{user.plan.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 dark:text-slate-400">{user.expires_at || 'Nunca'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                       <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold">I: {user.usage.images}</span>
                       <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold">V: {user.usage.animations}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(user.id, 'add_days')}
                        className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-lg transition-colors"
                        title="Adicionar Dias"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, 'block')}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                        title="Bloquear Acesso"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) => {
  const colorMap: any = {
    purple: 'bg-purple-500/10 text-purple-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${colorMap[color]}`}>
         {/* Simple icons based on type */}
         <span className="font-bold">#</span>
      </div>
      <div className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value.toLocaleString()}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: UserStatus }) => {
  const styles: any = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels: any = {
    active: 'Ativo',
    trial: 'Em Teste',
    expired: 'Expirado',
    blocked: 'Bloqueado'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default AdminDashboard;
