import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URl as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Vite'ın dev sunucusunda HMR bu modülü zaman zaman yeniden çalıştırabiliyor;
// her seferinde yeni bir createClient() çağrısı yeni bir GoTrue (auth) istemciği
// demek — eskisiyle aynı localStorage anahtarı/kilidi üzerinde yarışarak
// getSession()/token yenileme çağrılarının donmasına yol açabiliyor. Bu yüzden
// istemci globalThis üzerinde tutulup HMR sırasında yeniden kullanılıyor.
const globalForSupabase = globalThis as unknown as { __vatozSupabase?: SupabaseClient };

export const supabase = globalForSupabase.__vatozSupabase ?? createClient(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  globalForSupabase.__vatozSupabase = supabase;
}
