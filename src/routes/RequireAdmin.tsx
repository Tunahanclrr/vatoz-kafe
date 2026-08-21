import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RequireAdmin() {
  const { session, isAdmin, loading, profileLoading, authError, refreshCustomer } = useAuth();
  const [retrying, setRetrying] = useState(false);

  if (loading || (session && profileLoading)) return <div className="route-loading">Yükleniyor…</div>;

  if (session && authError) {
    return (
      <div className="route-loading route-error">
        <p>Bağlantı sorunu — durumun doğrulanamadı. Çıkış yapılmadı, sadece tekrar dene.</p>
        <button
          className="button button-dark"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            await refreshCustomer();
            setRetrying(false);
          }}
        >
          <RefreshCw size={16} /> {retrying ? 'Deneniyor…' : 'Tekrar dene'}
        </button>
      </div>
    );
  }

  if (!session || !isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}
