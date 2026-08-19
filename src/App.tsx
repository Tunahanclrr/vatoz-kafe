import { useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUpRight, Bean, ChevronRight, Clock3, Instagram,
  MapPin, Menu as MenuIcon, Quote, Sparkles, Star, X,
} from 'lucide-react';

type MenuCategory = 'Tümü' | 'Kahve' | 'Soğuk' | 'Atıştırmalık';
type MenuItem = { name: string; description: string; price: string; category: Exclude<MenuCategory, 'Tümü'>; tag?: string; color: string };

const menuItems: MenuItem[] = [
  { name: 'Cool Lime', description: 'Nane, lime, buz gibi bir ferahlık.', price: '₺145', category: 'Soğuk', tag: 'Vatoz favorisi', color: 'lime' },
  { name: 'Americano', description: 'Yoğun, dengeli, tam kararında.', price: '₺110', category: 'Kahve', tag: 'Günün klasiği', color: 'orange' },
  { name: 'Vatoz Latte', description: 'Kremamsı süt, çift shot espresso.', price: '₺155', category: 'Kahve', tag: 'İmza', color: 'teal' },
  { name: 'Berry Fizz', description: 'Orman meyveleri, soda ve ışıltı.', price: '₺160', category: 'Soğuk', tag: 'Yeni', color: 'coral' },
  { name: 'Cinnamon Roll', description: 'Fırından yeni çıkmış, tarçınlı mutluluk.', price: '₺125', category: 'Atıştırmalık', color: 'yellow' },
  { name: 'Avokado Toast', description: 'Ekşi maya, avokado, chili ve limon.', price: '₺210', category: 'Atıştırmalık', tag: 'Güne iyi başla', color: 'green' },
  { name: 'Çilekli Matcha', description: 'Yumuşak matcha, çilek ve süt buluşması.', price: '₺175', category: 'Soğuk', tag: 'Yeni', color: 'coral' },
  { name: 'Flat White', description: 'İpeksi süt köpüğü, güçlü espresso.', price: '₺145', category: 'Kahve', color: 'yellow' },
];
const categories: MenuCategory[] = ['Tümü', 'Kahve', 'Soğuk', 'Atıştırmalık'];
const galleryImages = [
  '/images/gallery/SaveClip.App_748718187_18117296326825726_945859302219384949_n.jpg',
  '/images/gallery/SaveClip.App_773378832_18121941910825726_5797171146583229766_n.jpg',
  '/images/gallery/SaveClip.App_772547349_18121592215825726_5183183316277411571_n.jpg',
  '/images/gallery/SaveClip.App_751035103_18118069162825726_6500021019864214253_n.jpg',
  '/images/gallery/SaveClip.App_757698955_18119603713825726_8517472247049455749_n.jpg',
];

type HeaderProps = { menuOpen: boolean; setMenuOpen: (open: boolean) => void; onMenuClick: () => void; onHomeClick: () => void };
function Header({ menuOpen, setMenuOpen, onMenuClick, onHomeClick }: HeaderProps) {
  const close = () => setMenuOpen(false);
  return <nav className="nav container">
    <button className="brand brand-button" onClick={onHomeClick} aria-label="Vatoz Kafe ana sayfa"><span className="brand-mark">V</span><span><strong>VATOZ</strong><small>KAFE</small></span></button>
    <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
      <button onClick={() => { onMenuClick(); close(); }}>Menü</button>
      <a href="#hikaye" onClick={close}>Biz kimiz?</a><a href="#galeri" onClick={close}>Galeri</a><a href="#ziyaret" onClick={close}>Bizi bul</a>
      <button className="nav-order" onClick={() => { onMenuClick(); close(); }}>Sipariş ver <ArrowUpRight size={16} /></button>
    </div>
    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menüyü aç veya kapat">{menuOpen ? <X size={24} /> : <MenuIcon size={24} />}</button>
  </nav>;
}

function MenuCard({ item }: { item: MenuItem }) {
  return <article className={`menu-card ${item.color}`}><div className="menu-card-top"><span className="menu-icon"><Bean size={20} /></span>{item.tag && <span className="item-tag">{item.tag}</span>}</div><h3>{item.name}</h3><p>{item.description}</p><div className="menu-card-bottom"><strong>{item.price}</strong><button aria-label={`${item.name} detayları`}><ArrowUpRight size={18} /></button></div></article>;
}

function MenuPage({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Tümü');
  const visibleItems = activeCategory === 'Tümü' ? menuItems : menuItems.filter((item) => item.category === activeCategory);
  return <div className="menu-page"><div className="menu-page-head container"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Ana sayfaya dön</button><div className="eyebrow coral-text"><span className="eyebrow-dot" /> Vatoz menü</div><h1>Canın ne<br /><em>çekiyor?</em></h1><p>Cool Lime'dan Americano'ya, moduna göre seç. Hepsi Vatoz vibe'ıyla hazırlanır.</p></div><div className="menu-page-list container"><div className="filter-row"><div className="filters">{categories.map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><span className="menu-count">{visibleItems.length} lezzet</span></div><div className="menu-grid">{visibleItems.map((item) => <MenuCard item={item} key={item.name} />)}</div></div></div>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenuPage, setShowMenuPage] = useState(false);
  const openMenuPage = () => { setShowMenuPage(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { setShowMenuPage(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  if (showMenuPage) return <main className="site-shell"><Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} onMenuClick={openMenuPage} onHomeClick={goHome} /><MenuPage onBack={goHome} /><footer className="footer container"><button className="brand brand-button" onClick={goHome}><span className="brand-mark">V</span><span><strong>VATOZ</strong><small>KAFE</small></span></button><span className="footer-copy">© 2024 Vatoz Kafe — vibe'ı olan kafe.</span><a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a></footer></main>;
  return <main className="site-shell">
    <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} onMenuClick={openMenuPage} onHomeClick={goHome} />
    <section className="hero container" id="top"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Mudanya'nın en renkli durağı</div><h1>Ruh halini<br /><em>değiştirir.</em></h1><p className="hero-lede">İyi kahve, iyi müzik, iyi hisler. Vatoz'un renkli dünyasına dal; vibe'ı olan kafe deneyimini her yudumda hatırla.</p><div className="hero-actions"><button className="button button-dark" onClick={openMenuPage}>Menüyü keşfet <ArrowDown size={17} /></button><a href="#hikaye" className="text-link">Bizi tanı <ChevronRight size={17} /></a></div><div className="hero-note"><Star size={15} fill="currentColor" /> Her fincanda biraz daha iyi bir gün.</div></div><div className="hero-art"><div className="sunburst" /><div className="sticker sticker-top">vibe<br /><span>check</span></div><div className="image-frame"><img src="/images/vatoz_kafe.jpg" alt="Vatoz Kafe'nin renkli deniz temalı logosu" /></div><div className="floating-card"><Bean size={20} /><span>Bugün<br /><b>iyi geçecek.</b></span></div><span className="scribble">sip sip hooray!</span></div></section>
    <div className="ticker" aria-label="Vatoz Kafe sloganı"><div className="ticker-track"><span>VIBE'I OLAN KAFE</span><i>✳</i><span>RUH HALİNİ DEĞİŞTİRİR</span><i>✳</i><span>COOL LIME'DAN AMERICANO'YA</span><i>✳</i><span>VIBE'I OLAN KAFE</span><i>✳</i></div></div>
    <section className="menu-section container" id="menu"><div className="section-heading"><div><div className="eyebrow coral-text"><span className="eyebrow-dot" /> Bugün ne içiyoruz?</div><h2>Menüden <em>seç.</em></h2></div><p>Canın ne çekiyorsa. Her mod için taze, renkli ve biraz da sürprizli.</p></div><div className="preview-menu"><div className="preview-copy"><span>Lezzet haritası</span><strong>Vatoz'da<br />her vibe'a<br /><em>bir yudum.</em></strong><button className="text-link" onClick={openMenuPage}>Tüm menüyü gör <ArrowUpRight size={17} /></button></div><div className="preview-items">{menuItems.slice(0, 4).map((item) => <MenuCard item={item} key={item.name} />)}</div></div></section>
    <section className="story-section" id="hikaye"><div className="story-blob blob-a" /><div className="story-blob blob-b" /><div className="container story-inner"><div className="story-label"><Sparkles size={18} /> Vatoz manifestosu</div><div className="story-content"><h2>Burada kahve<br /><em>sadece kahve değil.</em></h2><div><p>Vatoz, güne daha renkli bakmak isteyenlerin buluşma noktası. Biraz deniz, biraz şehir, bolca iyi enerji.</p><p>İster bilgisayarını aç, ister arkadaşınla saatlerce konuş. Burada herkes kendi vibe'ını bulur.</p><a className="text-link light-link" href="#ziyaret">Bize uğra <ChevronRight size={17} /></a></div></div><div className="story-stats"><div><strong>100%</strong><span>iyi enerji</span></div><div><strong>∞</strong><span>kahve molası</span></div><div><strong>7/24</strong><span>vibe açık</span></div></div></div></section>
    <section className="gallery-section container" id="galeri"><div className="section-heading"><div><div className="eyebrow coral-text"><span className="eyebrow-dot" /> Vatoz'dan kareler</div><h2>Vibe'ı <em>gör.</em></h2></div><p>Bir fincan kahve, biraz renk ve Mudanya'nın güzel enerjisi.</p></div><div className="gallery-grid">{galleryImages.map((image, index) => <div className={`gallery-photo photo-${index + 1}`} key={image}><img src={image} alt={`Vatoz Kafe galeri fotoğrafı ${index + 1}`} /></div>)}</div></section>
    <section className="quote-section"><div className="container quote-inner"><Quote size={36} /><p>“Bir kahve içmeye geldim,<br /><em>vibe'ımı bulup çıktım.</em>”</p><span>— Vatoz müdavimi</span></div></section>
    <section className="visit-section container" id="ziyaret"><div className="visit-card"><div className="eyebrow"><span className="eyebrow-dot" /> Karşılaşalım</div><h2>Vibe'ını<br /><em>yanına al.</em></h2><p>Mudanya Güzelyalı'nın renkli sokaklarında, seni bekleyen bir masa ve güzel bir fincan var.</p><div className="visit-details"><span><MapPin size={18} /> Güzelyalı, Mudanya / Bursa</span><span><Clock3 size={18} /> Her gün 09:00 — 00:00</span></div><a className="button button-coral" href="https://maps.google.com/?q=Mudanya%20Guzelyali" target="_blank" rel="noreferrer">Yol tarifi al <ArrowUpRight size={17} /></a></div><div className="visit-side"><div className="side-circle"><span>vatoz</span><b>kafe</b></div><div className="side-note">Kahven hazır,<br />müzik açık.</div></div></section>
    <footer className="footer container"><button className="brand brand-button" onClick={goHome}><span className="brand-mark">V</span><span><strong>VATOZ</strong><small>KAFE</small></span></button><span className="footer-copy">© 2024 Vatoz Kafe — Mudanya Güzelyalı.</span><a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a></footer>
  </main>;
}
export default App;
