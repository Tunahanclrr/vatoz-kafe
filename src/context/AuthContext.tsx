import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withTimeout';
import type { Customer } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  customer: Customer | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  /** Oturum var ama profil/admin durumu ağ sorunu yüzünden doğrulanamadı — "çıkış yapıldı" değil, "bağlantı sorunu" demek. */
  authError: boolean;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  // supabase-js istemcisi ara sıra (özellikle arka planda token yenilerken) tek bir isteği
  // anormal yavaşlatabiliyor. Bu yüzden birkaç kez kısa aralıklarla yeniden deneniyor.
  // customer ve is_admin sorguları birbirinden BAĞIMSIZ yürütülüyor ki biri takılırsa
  // diğeri (ör. sayfayı açan customer verisi) engellenmesin; hepsi başarısız olursa
  // oturumu "kapatmış" gibi davranmak yerine authError=true işaretlenir (route guard'lar
  // bunu görünce login'e atmak yerine "bağlantı sorunu, tekrar dene" gösterir).
  const loadProfile = async (userId: string) => {
    const customerTask = withRetry(() => supabase.from('customers').select('*').eq('id', userId).maybeSingle())
      .then((res) => {
        setCustomer(res.data ?? null);
        return true;
      })
      .catch((err) => {
        console.error('Müşteri profili yüklenemedi (bağlantı sorunu):', err);
        return false;
      });

    const adminTask = withRetry(() => supabase.rpc('is_admin'))
      .then((res) => {
        setIsAdmin(Boolean(res.data));
        return true;
      })
      .catch((err) => {
        console.error('Admin kontrolü yapılamadı (bağlantı sorunu):', err);
        return false;
      });

    const [customerOk, adminOk] = await Promise.all([customerTask, adminTask]);
    setAuthError(!customerOk && !adminOk);
  };

  const refreshCustomer = async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      let currentSession: Session | null = null;
      try {
        const { data } = await withRetry(() => supabase.auth.getSession());
        currentSession = data.session;
      } catch (err) {
        console.error('Oturum bilgisi alınamadı (bağlantı sorunu):', err);
        if (active) setAuthError(true);
      }
      if (!active) return;
      setSession(currentSession);
      if (currentSession?.user.id) {
        setProfileLoading(true);
        await loadProfile(currentSession.user.id);
        if (active) setProfileLoading(false);
      }
      if (active) setLoading(false);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        setProfileLoading(true);
        await loadProfile(newSession.user.id);
        if (active) setProfileLoading(false);
      } else {
        setCustomer(null);
        setIsAdmin(false);
        setAuthError(false);
        setProfileLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Admin bir siparişi onaylayıp puan işlediğinde, müşterinin kendi sekmesindeki
  // puan bakiyesi sayfa yenilenmeden canlı güncellensin diye customers satırını dinle.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    const channel = supabase
      .channel(`customer-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${userId}` },
        (payload) => setCustomer(payload.new as Customer),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  return (
    <AuthContext.Provider value={{ session, customer, isAdmin, loading, profileLoading, authError, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
