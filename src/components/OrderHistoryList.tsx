import { Gift } from 'lucide-react';
import type { OrderWithItems } from '@/types/database';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kasada bekliyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
};

interface OrderHistoryListProps {
  orders: OrderWithItems[];
  loading?: boolean;
  limit?: number;
}

export function OrderHistoryList({ orders, loading, limit }: OrderHistoryListProps) {
  const visible = limit ? orders.slice(0, limit) : orders;

  if (loading) return <p>Yükleniyor…</p>;
  if (visible.length === 0) return <p className="order-empty">Henüz bir sipariş vermedin.</p>;

  return (
    <div className="order-history">
      {visible.map((order) => (
        <div className="order-history-card" key={order.id}>
          <div className="order-history-top">
            <strong>#{order.order_code}</strong>
            <span className={`order-status order-status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
          </div>
          <ul>
            {order.order_items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.products?.name ?? (item.is_reward ? 'Ödül' : 'Ürün')}
                {item.is_reward && <Gift size={12} />}
              </li>
            ))}
          </ul>
          <div className="order-history-bottom">
            <span>₺{order.total_price.toFixed(0)}</span>
            {order.status === 'completed' && <span>+{order.total_vibe_points} puan</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
