
import { supabase } from '../lib/supabase';

export type UsageType = 'image' | 'video';

const LIMITS = {
  image: 50,
  video: 10
};

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Verifica e atualiza os contadores se for um novo dia.
 * Retorna o perfil atualizado do usuário.
 */
async function getOrResetProfile(userId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    // Se não existir perfil, criamos um novo com os limites zerados
    const newProfile = {
      id: userId,
      images_used_today: 0,
      videos_used_today: 0,
      last_reset_date: today
    };
    
    const { data: created } = await supabase
      .from('profiles')
      .upsert(newProfile)
      .select()
      .single();
      
    return created || newProfile;
  }

  // Se a data do banco for diferente de hoje, resetamos
  if (profile.last_reset_date !== today) {
    const resetData = {
      images_used_today: 0,
      videos_used_today: 0,
      last_reset_date: today
    };

    const { data: updated } = await supabase
      .from('profiles')
      .update(resetData)
      .eq('id', userId)
      .select()
      .single();

    return updated || { ...profile, ...resetData };
  }

  return profile;
}

export const getQuotaStatus = async (userId: string, type: UsageType): Promise<QuotaStatus> => {
  try {
    const profile = await getOrResetProfile(userId);
    const used = type === 'image' ? (profile.images_used_today || 0) : (profile.videos_used_today || 0);
    const limit = LIMITS[type];
    
    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used)
    };
  } catch (err) {
    console.error("Erro ao verificar quota:", err);
    // Fallback seguro (permite se o banco falhar, mas loga erro)
    return { allowed: true, used: 0, limit: LIMITS[type], remaining: LIMITS[type] };
  }
};

export const incrementUsage = async (userId: string, type: UsageType) => {
  try {
    const profile = await getOrResetProfile(userId);
    const field = type === 'image' ? 'images_used_today' : 'videos_used_today';
    const newValue = (profile[field] || 0) + 1;

    await supabase
      .from('profiles')
      .update({ [field]: newValue })
      .eq('id', userId);
      
    return newValue;
  } catch (err) {
    console.error("Erro ao incrementar uso:", err);
    return 0;
  }
};
