import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { CARD_COLORS, MenuCard } from '@/components/MenuCard';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';

export function MenuPage() {
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();
  const { addProduct, lines, itemCount, totalPrice } = useCart();
  const [activeCategory, setActiveCategory] = useState('Tümü');

  const categories = useMemo(() => ['Tümü', ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visibleItems = activeCategory === 'Tümü' ? products : products.filter((p) => p.category === activeCategory);

  return (
    <div className="menu-page">
      <div className="menu-page-head container">
        <button className="back-link" onClick={() => navigate('/')}>
          <ArrowLeft size={17} /> Ana sayfaya dön
        </button>
        <div className="eyebrow coral-text">
          <span className="eyebrow-dot" /> Vatoz menü
        </div>
        <h1>
          Canın ne
          <br />
          <em>çekiyor?</em>
        </h1>
        <p>Cool Lime'dan Americano'ya, moduna göre seç. Hepsi Vatoz vibe'ıyla hazırlanır.</p>
      </div>
      <div className="menu-page-list container">
        <div className="filter-row">
          <div className="filters">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="menu-count">{loading ? 'yükleniyor…' : `${visibleItems.length} lezzet`}</span>
        </div>
        <div className="menu-grid">
          {visibleItems.map((product, index) => (
            <MenuCard
              key={product.id}
              product={product}
              color={CARD_COLORS[index % CARD_COLORS.length]}
              onAdd={addProduct}
              inCart={lines.some((l) => l.kind === 'product' && l.product.id === product.id)}
            />
          ))}
        </div>
        {error && <p className="auth-error">{error}</p>}
        {!loading && !error && visibleItems.length === 0 && <p className="menu-empty">Bu kategoride henüz ürün yok.</p>}
      </div>

      {itemCount > 0 && (
        <button className="cart-bar" onClick={() => navigate('/order')}>
          <span>{itemCount} ürün sepette</span>
          <strong>₺{totalPrice.toFixed(0)}</strong>
          <span className="cart-bar-cta">
            Sepete git <ArrowUpRight size={16} />
          </span>
        </button>
      )}
    </div>
  );
}
