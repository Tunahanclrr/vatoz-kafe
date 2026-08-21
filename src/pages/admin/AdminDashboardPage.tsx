import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Coffee, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/types/database';

interface Stats {
  pendingCount: number;
  todayCompletedCount: number;
  todayRevenue: number;
  totalCustomers: number;
  activeProducts: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);

  useEffect(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const load = async () => {
      const [pending, customersCount, activeProducts, todayOrders, recent] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('total_price').eq('status', 'completed').gte('completed_at', startOfToday.toISOString()),
        supabase
          .from('orders')
          .select('*, order_items(*, products(name, image_url))')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5),
      ]);

      const todayRevenue = (todayOrders.data ?? []).reduce((sum, o) => sum + Number(o.total_price), 0);

      setStats({
        pendingCount: pending.count ?? 0,
        todayCompletedCount: todayOrders.data?.length ?? 0,
        todayRevenue,
        totalCustomers: customersCount.count ?? 0,
        activeProducts: activeProducts.count ?? 0,
      });
      setRecentOrders((recent.data as unknown as OrderWithItems[]) ?? []);
    };

    load();
  }, []);

  return (
    <div className="admin-page">
      <h1>Panel</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>
            <Clock3 size={16} /> Bekleyen sipariş
          </span>
          <strong>{stats?.pendingCount ?? '—'}</strong>
          <Link to="/admin/orders" className="text-link">
            Siparişlere git
          </Link>
        </div>
        <div className="admin-stat-card">
          <span>
            <TrendingUp size={16} /> Bugünkü ciro
          </span>
          <strong>₺{stats ? stats.todayRevenue.toFixed(0) : '—'}</strong>
          <small>{stats?.todayCompletedCount ?? 0} tamamlanan sipariş</small>
        </div>
        <div className="admin-stat-card">
          <span>
            <Users size={16} /> Müşteri
          </span>
          <strong>{stats?.totalCustomers ?? '—'}</strong>
          <Link to="/admin/customers" className="text-link">
            Müşterilere git
          </Link>
        </div>
        <div className="admin-stat-card">
          <span>
            <Coffee size={16} /> Aktif ürün
          </span>
          <strong>{stats?.activeProducts ?? '—'}</strong>
          <Link to="/admin/products" className="text-link">
            Ürünlere git
          </Link>
        </div>
      </div>

      <h2 className="admin-section-title">Son tamamlanan siparişler</h2>
      <div className="admin-table">
        {recentOrders.map((order) => (
          <div className="admin-table-row" key={order.id}>
            <div>
              <strong>#{order.order_code}</strong>
              <span>
                {order.order_items.map((item) => `${item.quantity}x ${item.products?.name ?? 'Ürün'}`).join(', ')}
              </span>
            </div>
            <div className="admin-points-badge">₺{order.total_price.toFixed(0)}</div>
          </div>
        ))}
        {recentOrders.length === 0 && <p className="order-empty">Henüz tamamlanan sipariş yok.</p>}
      </div>
    </div>
  );
}
