import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Bean, ChevronRight, Clock3, Instagram, MapPin, Quote, Sparkles, Star } from 'lucide-react';
import { CARD_COLORS, MenuCard } from '@/components/MenuCard';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';

const galleryImages = [
  '/images/gallery/SaveClip.App_748718187_18117296326825726_945859302219384949_n.jpg',
  '/images/gallery/SaveClip.App_773378832_18121941910825726_5797171146583229766_n.jpg',
  '/images/gallery/SaveClip.App_772547349_18121592215825726_5183183316277411571_n.jpg',
  '/images/gallery/SaveClip.App_751035103_18118069162825726_6500021019864214253_n.jpg',
  '/images/gallery/SaveClip.App_757698955_18119603713825726_8517472247049455749_n.jpg',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addProduct, lines } = useCart();
  const previewItems = products.slice(0, 4);

  return (
    <>
      <section className="hero container" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Mudanya'nın en renkli durağı
          </div>
          <h1>
            Ruh halini
            <br />
            <em>değiştirir.</em>
          </h1>
          <p className="hero-lede">
            İyi kahve, iyi müzik, iyi hisler. Vatoz'un renkli dünyasına dal; vibe'ı olan kafe deneyimini her
            yudumda hatırla.
          </p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => navigate('/menu')}>
              Sipariş ver <ArrowDown size={17} />
            </button>
            <a href="#hikaye" className="text-link">
              Bizi tanı <ChevronRight size={17} />
            </a>
          </div>
          <div className="hero-note">
            <Star size={15} fill="currentColor" /> Her fincanda biraz daha iyi bir gün.
          </div>
        </div>
        <div className="hero-art">
          <div className="sunburst" />
          <div className="sticker sticker-top">
            vibe
            <br />
            <span>check</span>
          </div>
          <div className="image-frame">
            <img src="/images/vatoz_kafe.jpg" alt="Vatoz Kafe'nin renkli deniz temalı logosu" />
          </div>
          <div className="floating-card">
            <Bean size={20} />
            <span>
              Bugün
              <br />
              <b>iyi geçecek.</b>
            </span>
          </div>
          <span className="scribble">sip sip hooray!</span>
        </div>
      </section>

      <div className="ticker" aria-label="Vatoz Kafe sloganı">
        <div className="ticker-track">
          <span>VIBE'I OLAN KAFE</span>
          <i>✳</i>
          <span>RUH HALİNİ DEĞİŞTİRİR</span>
          <i>✳</i>
          <span>COOL LIME'DAN AMERICANO'YA</span>
          <i>✳</i>
          <span>VIBE'I OLAN KAFE</span>
          <i>✳</i>
        </div>
      </div>

      <section className="menu-section container" id="menu">
        <div className="section-heading">
          <div>
            <div className="eyebrow coral-text">
              <span className="eyebrow-dot" /> Bugün ne içiyoruz?
            </div>
            <h2>
              Menüden <em>seç.</em>
            </h2>
          </div>
          <p>Canın ne çekiyorsa. Her mod için taze, renkli ve biraz da sürprizli.</p>
        </div>
        <div className="preview-menu">
          <div className="preview-copy">
            <span>Lezzet haritası</span>
            <strong>
              Vatoz'da
              <br />
              her vibe'a
              <br />
              <em>bir yudum.</em>
            </strong>
            <button className="text-link" onClick={() => navigate('/menu')}>
              Tüm menüyü gör <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="preview-items">
            {previewItems.map((product, index) => (
              <MenuCard
                key={product.id}
                product={product}
                color={CARD_COLORS[index % CARD_COLORS.length]}
                onAdd={addProduct}
                inCart={lines.some((l) => l.kind === 'product' && l.product.id === product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="story-section" id="hikaye">
        <div className="story-blob blob-a" />
        <div className="story-blob blob-b" />
        <div className="container story-inner">
          <div className="story-label">
            <Sparkles size={18} /> Vatoz manifestosu
          </div>
          <div className="story-content">
            <h2>
              Burada kahve
              <br />
              <em>sadece kahve değil.</em>
            </h2>
            <div>
              <p>Vatoz, güne daha renkli bakmak isteyenlerin buluşma noktası. Biraz deniz, biraz şehir, bolca iyi enerji.</p>
              <p>İster bilgisayarını aç, ister arkadaşınla saatlerce konuş. Burada herkes kendi vibe'ını bulur.</p>
              <a className="text-link light-link" href="#ziyaret">
                Bize uğra <ChevronRight size={17} />
              </a>
            </div>
          </div>
          <div className="story-stats">
            <div>
              <strong>100%</strong>
              <span>iyi enerji</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>kahve molası</span>
            </div>
            <div>
              <strong>7/24</strong>
              <span>vibe açık</span>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-section container" id="galeri">
        <div className="section-heading">
          <div>
            <div className="eyebrow coral-text">
              <span className="eyebrow-dot" /> Vatoz'dan kareler
            </div>
            <h2>
              Vibe'ı <em>gör.</em>
            </h2>
          </div>
          <p>Bir fincan kahve, biraz renk ve Mudanya'nın güzel enerjisi.</p>
        </div>
        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <div className={`gallery-photo photo-${index + 1}`} key={image}>
              <img src={image} alt={`Vatoz Kafe galeri fotoğrafı ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="quote-section">
        <div className="container quote-inner">
          <Quote size={36} />
          <p>
            "Bir kahve içmeye geldim,
            <br />
            <em>vibe'ımı bulup çıktım.</em>"
          </p>
          <span>— Vatoz müdavimi</span>
        </div>
      </section>

      <section className="visit-section container" id="ziyaret">
        <div className="visit-card">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Karşılaşalım
          </div>
          <h2>
            Vibe'ını
            <br />
            <em>yanına al.</em>
          </h2>
          <p>Mudanya Güzelyalı'nın renkli sokaklarında, seni bekleyen bir masa ve güzel bir fincan var.</p>
          <div className="visit-details">
            <span>
              <MapPin size={18} /> Güzelyalı, Mudanya / Bursa
            </span>
            <span>
              <Clock3 size={18} /> Her gün 09:00 — 00:00
            </span>
          </div>
          <a className="button button-coral" href="https://maps.google.com/?q=Mudanya%20Guzelyali" target="_blank" rel="noreferrer">
            Yol tarifi al <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="visit-side">
          <div className="side-circle">
            <span>vatoz</span>
            <b>kafe</b>
          </div>
          <div className="side-note">
            Kahven hazır,
            <br />
            müzik açık.
          </div>
        </div>
      </section>

      <footer className="footer container">
        <span className="brand">
          <span className="brand-mark">V</span>
          <span>
            <strong>VATOZ</strong>
            <small>KAFE</small>
          </span>
        </span>
        <span className="footer-copy">© 2024 Vatoz Kafe — Mudanya Güzelyalı.</span>
        <a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer">
          <Instagram size={18} /> Instagram
        </a>
      </footer>
    </>
  );
}
