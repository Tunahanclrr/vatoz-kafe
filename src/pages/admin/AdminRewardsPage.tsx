import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Reward } from '@/types/database';

const emptyForm = { name: '', description: '', required_points: '', reward_product_id: '', is_active: true };

export function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [{ data: rewardRows }, { data: productRows }] = await Promise.all([
      supabase.from('rewards').select('*').order('required_points', { ascending: true }),
      supabase.from('products').select('*').order('name', { ascending: true }),
    ]);
    setRewards(rewardRows ?? []);
    setProducts(productRows ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (reward: Reward) => {
    setEditingId(reward.id);
    setForm({
      name: reward.name,
      description: reward.description ?? '',
      required_points: String(reward.required_points),
      reward_product_id: reward.reward_product_id ?? '',
      is_active: reward.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.required_points) return setError('İsim ve gereken puan zorunlu.');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      required_points: Number(form.required_points),
      reward_product_id: form.reward_product_id || null,
      is_active: form.is_active,
    };
    const { error: saveError } = editingId
      ? await supabase.from('rewards').update(payload).eq('id', editingId)
      : await supabase.from('rewards').insert(payload);
    if (saveError) {
      setError(saveError.message);
    } else {
      resetForm();
      await load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from('rewards').delete().eq('id', id);
    await load();
  };

  return (
    <div className="admin-page">
      <h1>Ödüller</h1>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            İsim
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Gereken puan
            <input type="number" min="1" value={form.required_points} onChange={(e) => setForm({ ...form, required_points: e.target.value })} required />
          </label>
          <label>
            Karşılığı ürün
            <select value={form.reward_product_id} onChange={(e) => setForm({ ...form, reward_product_id: e.target.value })}>
              <option value="">— seçilmedi —</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif
          </label>
        </div>
        <label>
          Açıklama
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="admin-form-actions">
          <button className="button button-dark" type="submit" disabled={saving}>
            <Plus size={16} /> {editingId ? 'Kaydet' : 'Ödül ekle'}
          </button>
          {editingId && (
            <button type="button" className="text-link" onClick={resetForm}>
              Vazgeç
            </button>
          )}
        </div>
      </form>

      <div className="admin-table">
        {rewards.map((reward) => (
          <div className="admin-table-row" key={reward.id}>
            <div>
              <strong>{reward.name}</strong>
              <span>
                {reward.required_points} puan
                {!reward.is_active && ' · pasif'}
              </span>
            </div>
            <div className="admin-table-actions">
              <button onClick={() => startEdit(reward)} aria-label="Düzenle">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(reward.id)} aria-label="Sil">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
