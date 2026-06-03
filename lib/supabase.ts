import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── DB helpers ───────────────────────────────────────────────────────────────

export async function fetchCasts(companyId: string) {
  const { data, error } = await supabase
    .from('casts')
    .select('*')
    .eq('company_id', companyId)
    .order('monthly_sales', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMissions(companyId: string) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertMission(mission: {
  id?: number;
  company_id: string;
  title: string;
  condition: string;
  target: number;
  current: number;
  reward: string;
  deadline: string;
  achievers: number;
  total: number;
}) {
  const { data, error } = await supabase
    .from('missions')
    .upsert(mission, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMissionDb(id: number) {
  const { error } = await supabase.from('missions').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRecords(companyId: string) {
  const { data, error } = await supabase
    .from('performance_records')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertRecord(record: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('performance_records')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from('performance_records').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToMissions(companyId: string, callback: () => void) {
  return supabase
    .channel(`missions:${companyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'missions', filter: `company_id=eq.${companyId}` }, callback)
    .subscribe();
}
