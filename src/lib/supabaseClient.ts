import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let client: any = null;

// Proxy will lazy-initialize the client only when first accessed
// This prevents the "supabaseUrl is required" error on startup if variables are missing
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!client) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase não configurado. Por favor, configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações.');
      }
      client = createClient(supabaseUrl, supabaseAnonKey);
    }
    return client[prop];
  }
});
