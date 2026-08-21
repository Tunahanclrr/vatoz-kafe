import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import type { Reward } from '@/types/database';

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    withTimeout(supabase.from('rewards').select('*').eq('is_active', true).order('required_points', { ascending: true }))
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) throw fetchError;
        setRewards(data ?? []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Ödüller yüklenemedi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { rewards, loading, error };
}
