import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useAuth } from '@/context/AuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
      );
      if (signInError) {
        setError('E-posta veya şifre hatalı.');
        return;
      }
      const { data: adminFlag } = await withTimeout(supabase.rpc('is_admin'));
      if (!adminFlag) {
        setError('Bu hesap admin yetkisine sahip değil.');
        await supabase.auth.signOut();
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? 'Sunucuya ulaşılamadı (zaman aşımı). İnternet bağlantını veya Supabase projenin durumunu kontrol et.'
          : 'Giriş sırasında bir hata oluştu, tekrar dene.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page admin-auth container">
      <div className="auth-card">
        <div className="eyebrow coral-text">
          <span className="eyebrow-dot" /> Vatoz Kasa
        </div>
        <h1>
          Admin
          <br />
          <em>girişi.</em>
        </h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-posta
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Şifre
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="button button-dark" type="submit" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'} <ArrowUpRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
