import { useEffect } from 'react';
import { CheckCircle2, Gift, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/hooks/useRewards';
import { useMyOrders } from '@/hooks/useMyOrders';
import { OrderHistoryList } from '@/components/OrderHistoryList';
import { LogoutButton } from '@/components/LogoutButton';

export function ProfilePage() {
  const { customer } = useAuth();
  const { rewards } = useRewards();
  const { orders, loading: ordersLoading, error: ordersError, justCompleted, clearJustCompleted } = useMyOrders();

  const points = customer?.vibe_points ?? 0;
  const nextReward = rewards.filter((r) => r.required_points > points).sort((a, b) => a.required_points - b.required_points)[0];
  const pendingOrder = orders.find((o) => o.status === 'pending');

  useEffect(() => {
    if (!justCompleted) return;
    const timer = setTimeout(clearJustCompleted, 10000);
    return () => clearTimeout(timer);
  }, [justCompleted, clearJustCompleted]);

  return (
    <div className="profile-page container">
      <div className="profile-head">
        <div>
          <div className="eyebrow coral-text">
            <span className="eyebrow-dot" /> Profilim
          </div>
          <h1>Merhaba, {customer?.full_name ?? '...'}</h1>
        </div>
        <LogoutButton redirectTo="/" className="text-link" />
      </div>

      {justCompleted && (
        <div className="order-confirmed-banner">
          <CheckCircle2 size={22} />
          <div>
            <strong>Siparişiniz onaylanmıştır!</strong>
            <span>
              #{justCompleted.order_code} · +{justCompleted.total_vibe_points} vibe puan kazandın
            </span>
          </div>
          <button onClick={clearJustCompleted} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
      )}

      {pendingOrder && (
        <div className="home-pending-banner">
          <span>Kasada bekleyen siparişin var</span>
          <strong>#{pendingOrder.order_code}</strong>
        </div>
      )}

      <div className="points-card">
        <div className="points-card-value">
          <Sparkles size={22} /> {points}
        </div>
        <span>vibe puan</span>
        {nextReward ? (
          <p>
            <b>{nextReward.name}</b> ödülüne {nextReward.required_points - points} puan kaldı.
          </p>
        ) : (
          <p>Tebrikler, tüm ödülleri kazanabilecek puandasın!</p>
        )}
      </div>

      {rewards.length > 0 && (
        <div className="reward-picker">
          <h3>
            <Gift size={16} /> Ödüller
          </h3>
          <div className="reward-list">
            {rewards.map((reward) => (
              <div key={reward.id} className={`reward-chip static ${reward.required_points <= points ? 'selected' : 'disabled'}`}>
                {reward.name} · {reward.required_points} puan
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="profile-orders-title">Sipariş geçmişin</h2>
      {ordersError && <p className="auth-error">{ordersError}</p>}
      <OrderHistoryList orders={orders} loading={ordersLoading} />
    </div>
  );
}
