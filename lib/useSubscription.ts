import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSubscription(userId: string | null) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    supabase
      .from('subscribers')
      .select('is_active')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setIsPro(data?.is_active || false);
        setLoading(false);
      });
  }, [userId]);

  return { isPro, loading };
}