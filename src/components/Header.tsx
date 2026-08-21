import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu as MenuIcon, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogoutButton } from '@/components/LogoutButton';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session, customer, isAdmin } = useAuth();
  const close = () => setMenuOpen(false);
  const isCustomer = Boolean(session) && !isAdmin;

  return (
    <nav className="nav container">
      <Link className="brand brand-button" to="/" onClick={close} aria-label="Vatoz Kafe ana sayfa">
        <span className="brand-mark">V</span>
        <span>
          <strong>VATOZ</strong>
          <small>KAFE</small>
        </span>
      </Link>
      <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
        <Link to="/menu" onClick={close}>
          Menü
        </Link>
        {!isCustomer && (
          <>
            <Link to="/#hikaye" onClick={close}>
              Biz kimiz?
            </Link>
            <Link to="/#galeri" onClick={close}>
              Galeri
            </Link>
            <Link to="/#ziyaret" onClick={close}>
              Bizi bul
            </Link>
          </>
        )}
        {isCustomer ? (
          <>
            <Link to="/profile" onClick={close} className="nav-points">
              <Sparkles size={14} /> {customer?.vibe_points ?? 0} vibe puan
            </Link>
            <LogoutButton redirectTo="/" />
          </>
        ) : (
          <button
            onClick={() => {
              navigate('/login');
              close();
            }}
          >
            Giriş yap
          </button>
        )}
        <button
          className="nav-order"
          onClick={() => {
            navigate('/menu');
            close();
          }}
        >
          Sipariş ver <ArrowUpRight size={16} />
        </button>
      </div>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menüyü aç veya kapat">
        {menuOpen ? <X size={24} /> : <MenuIcon size={24} />}
      </button>
    </nav>
  );
}
