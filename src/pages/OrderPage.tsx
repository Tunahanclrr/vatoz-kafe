import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Gift, Minus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/hooks/useRewards';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import type { CreateOrderItem } from '@/types/database';

const ERROR_MESSAGES: Record<string, string> = {
  PENDING_ORDER_EXISTS: 'Zaten kasada bekleyen bir siparişin var. Önce onu tamamlat.',
  INSUFFICIENT_POINTS: 'Seçtiğin ödüller için yeterli vibe puanın yok.',
  PRODUCT_NOT_FOUND: 'Sepetteki bir ürün artık mevcut değil, sepetini gözden geçir.',
  REWARD_NOT_FOUND: 'Seçtiğin ödül artık mevcut değil.',
  EMPTY_ORDER: 'Sepetin boş.',
  NOT_AUTHENTICATED: 'Sipariş vermek için giriş yapmalısın.',
};

export function OrderPage() {
  const navigate = useNavigate();
  const { customer, refreshCustomer } = useAuth();
  const { lines, setProductQuantity, removeProduct, toggleReward, clear, totalPrice, totalPointsEarned, totalPointsRedeemed } =
    useCart();
  const { rewards } = useRewards();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  const points = customer?.vibe_points ?? 0;
  const pointsAfter = points - totalPointsRedeemed;

  const handleCreateOrder = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const items: CreateOrderItem[] = lines.map((line) =>
        line.kind === 'product'
          ? { product_id: line.product.id, quantity: line.quantity }
          : { reward_id: line.reward.id, quantity: line.quantity },
      );
      const { data, error: rpcError } = await withTimeout(supabase.rpc('create_order', { p_items: items }));
      if (rpcError) {
        setError(ERROR_MESSAGES[rpcError.message] ?? 'Sipariş oluşturulamadı, tekrar dene.');
        return;
      }
      setConfirmedCode(data.order_code);
      clear();
      await refreshCustomer();
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? 'Sunucuya ulaşılamadı (zaman aşımı), tekrar dene.'
          : 'Sipariş oluşturulamadı, tekrar dene.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedCode) {
    return (
      <div className="order-confirm container">
        <div className="eyebrow coral-text">
          <span className="eyebrow-dot" /> Sipariş alındı
        </div>
        <h1>Sipariş kodun</h1>
        <div className="order-code">{confirmedCode}</div>
        <p>Bu kodu kasaya söyle, ödemeni orada yap. Onaylandığında vibe puanların otomatik işlenecek.</p>
        <div className="order-confirm-actions">
          <Link className="button button-dark" to="/profile">
            Profilime git
          </Link>
          <Link className="text-link" to="/menu">
            Yeni sipariş ver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page container">
      <button className="back-link" onClick={() => navigate('/menu')}>
        <ArrowLeft size={17} /> Menüye dön
      </button>
      <div className="eyebrow coral-text">
        <span className="eyebrow-dot" /> Sepetin
      </div>
      <h1>Siparişini gözden geçir</h1>

      {lines.length === 0 ? (
        <p className="order-empty">Sepetin boş. Menüden bir şeyler seç.</p>
      ) : (
        <div className="order-lines">
          {lines.map((line) =>
            line.kind === 'product' ? (
              <div className="order-line" key={line.product.id}>
                <div>
                  <strong>{line.product.name}</strong>
                  <span>₺{line.product.price.toFixed(0)} · {line.product.vibe_points} puan</span>
                </div>
                <div className="order-line-qty">
                  <button onClick={() => setProductQuantity(line.product.id, line.quantity - 1)}>
                    <Minus size={14} />
                  </button>
                  <span>{line.quantity}</span>
                  <button onClick={() => setProductQuantity(line.product.id, line.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <button className="order-line-remove" onClick={() => removeProduct(line.product.id)} aria-label="Kaldır">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="order-line order-line-reward" key={line.reward.id}>
                <div>
                  <strong>
                    <Gift size={15} /> {line.reward.name}
                  </strong>
                  <span>{line.reward.required_points} puan ile ücretsiz</span>
                </div>
                <button className="order-line-remove" onClick={() => toggleReward(line.reward)} aria-label="Kaldır">
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          )}
        </div>
      )}

      {rewards.length > 0 && (
        <div className="reward-picker">
          <h3>
            <Sparkles size={16} /> Ödüllerin ({points} puan)
          </h3>
          <div className="reward-list">
            {rewards.map((reward) => {
              const selected = lines.some((l) => l.kind === 'reward' && l.reward.id === reward.id);
              const affordable = reward.required_points <= points || selected;
              return (
                <button
                  key={reward.id}
                  className={`reward-chip ${selected ? 'selected' : ''} ${!affordable ? 'disabled' : ''}`}
                  disabled={!affordable}
                  onClick={() => toggleReward(reward)}
                >
                  {selected && <Check size={14} />}
                  {reward.name} · {reward.required_points} puan
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="order-summary">
        <div>
          <span>Toplam tutar</span>
          <strong>₺{totalPrice.toFixed(0)}</strong>
        </div>
        <div>
          <span>Kazanacağın puan</span>
          <strong>+{totalPointsEarned}</strong>
        </div>
        {totalPointsRedeemed > 0 && (
          <div>
            <span>Harcanacak puan</span>
            <strong>-{totalPointsRedeemed} (kalan: {pointsAfter})</strong>
          </div>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button
        className="button button-dark order-submit"
        disabled={submitting || lines.length === 0}
        onClick={handleCreateOrder}
      >
        {submitting ? 'Oluşturuluyor…' : 'Sipariş Oluştur'}
      </button>
    </div>
  );
}
