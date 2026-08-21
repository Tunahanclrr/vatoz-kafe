import { useEffect, useState, type FormEvent } from 'react';
import { Check, Gift, Search, User, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { Modal } from '@/components/Modal';
import type { Order, OrderWithItems } from '@/types/database';

const ERROR_MESSAGES: Record<string, string> = {
  ORDER_NOT_FOUND: 'Bu kodla bekleyen bir sipariş bulunamadı.',
  NOT_AUTHORIZED: 'Bu işlem için admin yetkin yok.',
  INSUFFICIENT_POINTS: 'Müşterinin ödül için yeterli puanı kalmamış.',
};

const ORDER_SELECT = '*, order_items(*, products(name, image_url)), customers(full_name, phone)';

export function AdminOrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<OrderWithItems[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [modalOrder, setModalOrder] = useState<OrderWithItems | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPending = async () => {
    try {
      const { data } = await withTimeout(
        supabase.from('orders').select(ORDER_SELECT).eq('status', 'pending').order('created_at', { ascending: true }),
      );
      setPendingOrders((data as unknown as OrderWithItems[]) ?? []);
    } catch {
      setError('Bekleyen siparişler yüklenemedi (bağlantı zaman aşımı).');
    }
  };

  // Yeni bir sipariş geldiğinde tüm listeyi yeniden çekip sayfayı "yenilenmiş" gibi
  // hissettirmek yerine, sadece o tek siparişi çekip listeye ekliyoruz / çıkarıyoruz.
  const fetchOne = async (id: string) => {
    const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
    return data as unknown as OrderWithItems | null;
  };

  useEffect(() => {
    loadPending();
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          const newRow = payload.new as Order | null;
          const oldRow = payload.old as Partial<Order> | null;

          if (payload.eventType === 'DELETE') {
            if (oldRow?.id) setPendingOrders((prev) => prev.filter((o) => o.id !== oldRow.id));
            return;
          }

          if (newRow?.status === 'pending') {
            const full = await fetchOne(newRow.id);
            if (!full) return;
            setPendingOrders((prev) => {
              const withoutThis = prev.filter((o) => o.id !== full.id);
              return [...withoutThis, full].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              );
            });
          } else if (newRow) {
            // Onaylandı/iptal edildi — bekleyenler listesinden çıkar.
            setPendingOrders((prev) => prev.filter((o) => o.id !== newRow.id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openOrder = (order: OrderWithItems) => {
    setError(null);
    setNotice(null);
    setModalOrder(order);
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const code = codeInput.trim();
    if (!code) return;
    try {
      const { data } = await withTimeout(
        supabase.from('orders').select(ORDER_SELECT).eq('order_code', code).eq('status', 'pending').maybeSingle(),
      );
      if (!data) {
        setError('Bu kodla bekleyen bir sipariş bulunamadı.');
        return;
      }
      openOrder(data as unknown as OrderWithItems);
    } catch {
      setError('Sorgu zaman aşımına uğradı, tekrar dene.');
    }
  };

  const complete = async (code: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: rpcError } = await withTimeout(supabase.rpc('admin_complete_order', { p_order_code: code }));
      if (rpcError) {
        setError(ERROR_MESSAGES[rpcError.message] ?? 'Sipariş onaylanamadı.');
      } else {
        setNotice(`#${code} onaylandı, puanlar müşteriye işlendi.`);
        setModalOrder(null);
        setCodeInput('');
        await loadPending();
      }
    } catch {
      setError('Bağlantı zaman aşımına uğradı, tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (code: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: rpcError } = await withTimeout(supabase.rpc('admin_cancel_order', { p_order_code: code }));
      if (rpcError) {
        setError(ERROR_MESSAGES[rpcError.message] ?? 'Sipariş iptal edilemedi.');
      } else {
        setNotice(`#${code} iptal edildi.`);
        setModalOrder(null);
        setCodeInput('');
        await loadPending();
      }
    } catch {
      setError('Bağlantı zaman aşımına uğradı, tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Sipariş onayı</h1>
      <form className="admin-lookup" onSubmit={handleLookup}>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="Sipariş kodu (örn. 4821)"
          maxLength={5}
        />
        <button className="button button-dark" type="submit">
          <Search size={16} /> Bul
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}
      {notice && <p className="auth-notice">{notice}</p>}

      <h2 className="admin-section-title">Bekleyen siparişler ({pendingOrders.length})</h2>
      <div className="admin-pending-list">
        {pendingOrders.map((order) => (
          <button className="admin-pending-row" key={order.id} onClick={() => openOrder(order)}>
            <strong>#{order.order_code}</strong>
            <span>{order.customers?.full_name ?? 'Müşteri'}</span>
            <span>₺{order.total_price.toFixed(0)}</span>
            <span className="text-link">Detay / Onayla</span>
          </button>
        ))}
        {pendingOrders.length === 0 && <p className="order-empty">Şu an bekleyen sipariş yok.</p>}
      </div>

      {modalOrder && (
        <Modal title={`Sipariş #${modalOrder.order_code}`} onClose={() => setModalOrder(null)}>
          <div className="modal-customer">
            <User size={16} /> {modalOrder.customers?.full_name ?? 'Müşteri'}
            {modalOrder.customers?.phone && <span> · {modalOrder.customers.phone}</span>}
          </div>
          <ul className="modal-items">
            {modalOrder.order_items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.products?.name ?? 'Ürün'} {item.is_reward && <Gift size={13} />}
              </li>
            ))}
          </ul>
          <div className="modal-summary">
            <span>
              Toplam tutar <strong>₺{modalOrder.total_price.toFixed(0)}</strong>
            </span>
            <span>
              Kazanacağı puan <strong>+{modalOrder.total_vibe_points}</strong>
            </span>
            {modalOrder.total_points_redeemed > 0 && (
              <span>
                Harcanacak puan <strong>-{modalOrder.total_points_redeemed}</strong>
              </span>
            )}
          </div>
          <div className="admin-order-actions">
            <button className="button button-dark" disabled={busy} onClick={() => complete(modalOrder.order_code)}>
              <Check size={16} /> Onayla
            </button>
            <button className="button button-coral" disabled={busy} onClick={() => cancel(modalOrder.order_code)}>
              <X size={16} /> İptal et
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
