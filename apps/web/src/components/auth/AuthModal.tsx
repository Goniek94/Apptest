'use client';
import { useEffect, useState } from 'react';
import { useAuthModal, closeAuth } from '../../lib/auth';
import { Icon } from '../ui/Icon';
import { AuthForm } from './AuthForm';

export function AuthModal() {
  const { open, mode: initMode } = useAuthModal();
  const [mode, setMode] = useState(initMode);

  useEffect(() => { if (open) setMode(initMode); }, [open, initMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuth(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start md:items-center justify-center bg-ink/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={closeAuth}
    >
      <div
        className="relative bg-surface rounded-2xl shadow-[0_30px_70px_rgba(20,15,8,0.35)] w-full max-w-[460px] my-8 p-7 md:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuth}
          aria-label="Zamknij"
          className="absolute top-4 right-4 w-9 h-9 rounded-pill flex items-center justify-center text-muted hover:bg-bg hover:text-ink transition-colors"
        >
          <Icon name="x" size={18} />
        </button>
        <AuthForm mode={mode} onMode={setMode} onDone={closeAuth} />
      </div>
    </div>
  );
}
