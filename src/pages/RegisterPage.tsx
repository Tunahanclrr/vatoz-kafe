import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useAuth } from '@/context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (fullName.trim().length < 2) return setError('Lütfen ad soyad gir.');
    if (phone.trim().length < 10) return setError('Geçerli bir telefon numarası gir.');
    if (password.length < 6) return setError('Şifre en az 6 karakter olmalı.');

    setSubmitting(true);
    try {
      const { data: availability, error: availabilityError } = await withTimeout(
        supabase.rpc('check_availability', {
          p_phone: phone.trim(),
          p_email: email.trim().toLowerCase(),
        }),
      );
      if (availabilityError) throw availabilityError;
      if (availability?.phone_taken) {
        setError('Bu telefon numarası zaten kayıtlı.');
        return;
      }
      if (availability?.email_taken) {
        setError('Bu e-posta zaten kayıtlı.');
        return;
      }

      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
        }),
      );
      if (signUpError) throw signUpError;

      if (data.session) {
        navigate('/profile');
      } else {
        setNotice('Kayıt oluşturuldu! E-postanı onayladıktan sonra giriş yapabilirsin.');
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? 'Sunucuya ulaşılamadı (zaman aşımı). İnternet bağlantını kontrol et.'
          : err instanceof Error
            ? err.message
            : 'Kayıt sırasında bir hata oluştu, lütfen tekrar dene.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="eyebrow coral-text">
          <span className="eyebrow-dot" /> Vatoz'a katıl
        </div>
        <h1>
          Hesabını
          <br />
          <em>oluştur.</em>
        </h1>
        <p className="auth-lede">Kayıt ol, sipariş ver, her fincanda vibe puanı topla.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Ad Soyad
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adın Soyadın" required />
          </label>
          <label>
            Telefon
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" required />
          </label>
          <label>
            E-posta
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sen@ornek.com" required />
          </label>
          <label>
            Şifre
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" required />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button className="button button-dark" type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Kayıt ol'} <ArrowUpRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </div>
    </div>
  );
}
