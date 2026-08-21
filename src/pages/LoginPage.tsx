import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/profile';

  if (!loading && session) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const trimmed = identifier.trim();
      let email = trimmed;

      if (!trimmed.includes('@')) {
        const { data: resolvedEmail, error: lookupError } = await withTimeout(
          supabase.rpc('get_email_by_phone', { p_phone: trimmed }),
        );
        if (lookupError) throw lookupError;
        if (!resolvedEmail) {
          setError('Bu telefon numarasıyla kayıtlı hesap bulunamadı.');
          return;
        }
        email = resolvedEmail;
      }

      const { error: signInError } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
      if (signInError) {
        setError('E-posta/telefon veya şifre hatalı.');
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? 'Sunucuya ulaşılamadı (zaman aşımı). İnternet bağlantını kontrol et.'
          : 'Giriş sırasında bir hata oluştu.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="eyebrow coral-text">
          <span className="eyebrow-dot" /> Tekrar hoş geldin
        </div>
        <h1>
          Giriş
          <br />
          <em>yap.</em>
        </h1>
        <p className="auth-lede">E-posta veya telefon numaranla giriş yap.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-posta veya telefon
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="sen@ornek.com veya 05xx..." required />
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

        <p className="auth-switch">
          Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
        </p>
      </div>
    </div>
  );
}
