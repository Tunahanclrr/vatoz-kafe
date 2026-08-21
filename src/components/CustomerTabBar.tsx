import { NavLink } from 'react-router-dom';
import { Coffee, Sparkles } from 'lucide-react';

export function CustomerTabBar() {
  return (
    <nav className="tab-bar" aria-label="Müşteri menüsü">
      <NavLink to="/profile" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
        <Sparkles size={20} />
        <span>Profilim</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
        <Coffee size={20} />
        <span>Sipariş Ver</span>
      </NavLink>
    </nav>
  );
}
