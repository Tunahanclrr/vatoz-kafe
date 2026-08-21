import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

const emptyForm = { name: '', description: '', image_url: '', price: '', vibe_points: '', category: 'Kahve', is_active: true };

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      image_url: product.image_url ?? '',
      price: String(product.price),
      vibe_points: String(product.vibe_points),
      category: product.category,
      is_active: product.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.price) return setError('İsim ve fiyat zorunlu.');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      price: Number(form.price),
      vibe_points: Number(form.vibe_points) || 0,
      category: form.category.trim() || 'Kahve',
      is_active: form.is_active,
    };
    const { error: saveError } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload);
    if (saveError) {
      setError(saveError.message);
    } else {
      resetForm();
      await load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await load();
  };

  return (
    <div className="admin-page">
      <h1>Ürünler</h1>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            İsim
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Kategori
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label>
            Fiyat (₺)
            <input type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </label>
          <label>
            Vibe puanı
            <input type="number" min="0" value={form.vibe_points} onChange={(e) => setForm({ ...form, vibe_points: e.target.value })} />
          </label>
          <label>
            Görsel URL
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
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
            <Plus size={16} /> {editingId ? 'Kaydet' : 'Ürün ekle'}
          </button>
          {editingId && (
            <button type="button" className="text-link" onClick={resetForm}>
              Vazgeç
            </button>
          )}
        </div>
      </form>

      <div className="admin-table">
        {products.map((product) => (
          <div className="admin-table-row" key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <span>
                {product.category} · ₺{product.price.toFixed(0)} · {product.vibe_points} puan
                {!product.is_active && ' · pasif'}
              </span>
            </div>
            <div className="admin-table-actions">
              <button onClick={() => startEdit(product)} aria-label="Düzenle">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(product.id)} aria-label="Sil">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
