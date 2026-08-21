import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useAuth } from '@/context/AuthContext';
import type { Order, OrderWithItems } from '@/types/database';

export function useMyOrders() {
  const { customer } = useAuth();
  const customerId = customer?.id ?? null;
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<Order | null>(null);

  const fetchOrders = (id: string, active: { current: boolean }) => {
    setLoading(true);
    withTimeout(
      supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),
    )
      .then(({ data, error: fetchError }) => {
        if (!active.current) return;
        if (fetchError) throw fetchError;
        setOrders((data as unknown as OrderWithItems[]) ?? []);
      })
      .catch((err) => {
        if (!active.current) return;
        setError(err instanceof Error ? err.message : 'Siparişler yüklenemedi.');
      })
      .finally(() => {
        if (active.current) setLoading(false);
      });
  };

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const active = { current: true };
    fetchOrders(customerId, active);

    // Admin siparişi onayladığında/iptal ettiğinde bu liste sayfa yenilenmeden güncellensin diye dinle.
    const channel = supabase
      .channel(`my-orders-${customerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` },
        (payload) => {
          const previousStatus = (payload.old as Partial<Order> | null)?.status;
          const nextOrder = payload.new as Order | null;
          if (payload.eventType === 'UPDATE' && previousStatus === 'pending' && nextOrder?.status === 'completed') {
            setJustCompleted(nextOrder);
          }
          fetchOrders(customerId, active);
        },
      )
      .subscribe();

    return () => {
      active.current = false;
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  return { orders, loading, error, justCompleted, clearJustCompleted: () => setJustCompleted(null) };
}
