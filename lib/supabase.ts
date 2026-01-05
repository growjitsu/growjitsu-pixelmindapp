
import { createClient } from '@supabase/supabase-js';

// URL e Key fornecidas para conexão estável com a instância do Supabase
const supabaseUrl = 'https://ucrxzifpuuomcqyvxnwk.supabase.co';
const supabaseKey = 'sb_publishable_GED3SaZ551EqsYLGkJzJZQ_Cp6An6D6';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: { 'x-application-name': 'pixelmind' }
  }
});
