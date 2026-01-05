
import { supabase } from '../lib/supabase';

export type UsageType = 'image_generation' | 'image_enhancement' | 'video_generation';

export const logUsage = async (userId: string, type: UsageType) => {
  try {
    // Tenta registrar o log de uso. 
    // Em um cenário real, isso atualizaria uma tabela 'usage_logs' ou incrementaria um contador na tabela 'profiles'.
    const { error } = await supabase
      .from('usage_logs')
      .insert([
        { 
          user_id: userId, 
          action_type: type, 
          timestamp: new Date().toISOString() 
        }
      ]);
    
    if (error) {
      // Se a tabela não existir, apenas logamos no console para não quebrar a experiência do usuário (modo sandbox)
      console.warn("Log de uso não pôde ser salvo no banco (tabela usage_logs pode estar ausente):", error.message);
    }
  } catch (err) {
    console.error("Erro inesperado ao registrar uso:", err);
  }
};
