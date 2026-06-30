'use client';
import { useState } from 'react';
import { AuthForm } from '../../components/auth/AuthForm';
import type { AuthMode } from '../../lib/auth';

export function AuthPage({ mode: initial }: { mode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-12 md:py-16">
      <div className="bg-surface border border-line rounded-2xl shadow-[0_20px_50px_rgba(40,30,20,0.06)] p-7 md:p-10">
        <AuthForm mode={mode} onMode={setMode} />
      </div>
    </div>
  );
}
