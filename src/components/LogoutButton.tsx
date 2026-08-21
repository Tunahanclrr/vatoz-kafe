import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';

interface LogoutButtonProps {
  redirectTo: string;
  className?: string;
  label?: string;
}

export function LogoutButton({ redirectTo, className, label = 'Çıkış yap' }: LogoutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate(redirectTo);
  };

  return (
    <>
      <button className={className} onClick={() => setConfirming(true)}>
        <LogOut size={15} /> {label}
      </button>
      {confirming && (
        <Modal title="Çıkış yap" onClose={() => setConfirming(false)}>
          <p className="modal-confirm-text">Hesabından çıkış yapmak istediğine emin misin?</p>
          <div className="modal-confirm-actions">
            <button className="button button-coral" disabled={signingOut} onClick={handleConfirm}>
              <LogOut size={16} /> {signingOut ? 'Çıkış yapılıyor…' : 'Evet, çıkış yap'}
            </button>
            <button className="text-link" onClick={() => setConfirming(false)}>
              Vazgeç
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
