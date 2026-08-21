import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types/database';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('customers')
      .select('*')
      .order('vibe_points', { ascending: false })
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.full_name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      <h1>Müşteriler</h1>
      <div className="admin-lookup">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim, telefon veya e-posta ara…" />
        <span className="menu-count">
          <Search size={14} /> {filtered.length} müşteri
        </span>
      </div>
      <div className="admin-table">
        {filtered.map((customer) => (
          <div className="admin-table-row" key={customer.id}>
            <div>
              <strong>{customer.full_name}</strong>
              <span>
                {customer.phone} · {customer.email}
              </span>
            </div>
            <div className="admin-points-badge">{customer.vibe_points} puan</div>
          </div>
        ))}
        {filtered.length === 0 && <p className="order-empty">Sonuç bulunamadı.</p>}
      </div>
    </div>
  );
}
