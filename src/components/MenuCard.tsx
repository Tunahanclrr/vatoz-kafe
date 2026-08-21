import { Bean, Check, Plus, Sparkles } from 'lucide-react';
import type { Product } from '@/types/database';

export const CARD_COLORS = ['lime', 'orange', 'teal', 'coral', 'yellow', 'green'] as const;

interface MenuCardProps {
  product: Product;
  color: (typeof CARD_COLORS)[number];
  onAdd?: (product: Product) => void;
  inCart?: boolean;
}

export function MenuCard({ product, color, onAdd, inCart }: MenuCardProps) {
  return (
    <article className={`menu-card ${color}`}>
      <div className="menu-card-top">
        <span className="menu-icon">
          <Bean size={20} />
        </span>
        <span className="item-tag">
          <Sparkles size={11} /> {product.vibe_points} puan
        </span>
      </div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="menu-card-bottom">
        <strong>₺{product.price.toFixed(0)}</strong>
        {onAdd && (
          <button
            aria-label={`${product.name} sepete ekle`}
            onClick={() => onAdd(product)}
            className={inCart ? 'in-cart' : ''}
          >
            {inCart ? <Check size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>
    </article>
  );
}
