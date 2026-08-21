import { NavLink, Outlet } from 'react-router-dom';
import { Gauge, Gift, ReceiptText, ShoppingBag, Users } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Panel', icon: Gauge },
  { to: '/admin/orders', label: 'Siparişler', icon: ReceiptText },
  { to: '/admin/products', label: 'Ürünler', icon: ShoppingBag },
  { to: '/admin/rewards', label: 'Ödüller', icon: Gift },
  { to: '/admin/customers', label: 'Müşteriler', icon: Users },
];

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <div className="admin-nav-bar">
        <nav className="admin-nav container">
          <span className="brand admin-brand">
            <span className="brand-mark">V</span>
            <span>
              <strong>VATOZ</strong>
              <small>ADMIN</small>
            </span>
          </span>
          <div className="admin-nav-links">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={15} /> {label}
              </NavLink>
            ))}
          </div>
          <LogoutButton redirectTo="/admin" className="admin-logout" label="Çıkış" />
        </nav>
      </div>
      <div className="admin-content container">
        <Outlet />
      </div>
    </div>
  );
}
