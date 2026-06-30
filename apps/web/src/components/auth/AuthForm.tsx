'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../ui/Icon';
import { Field } from '../ui';
import { signIn, signUp, type AuthMode } from '../../lib/auth';
import type { AccountType } from '../../lib/api/auth';

function Social({ label, icon }: { label: string; icon: IconName }) {
  return (
    <button type="button" className="flex-1 card-surface py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-ink hover:border-gold transition-colors">
      <Icon name={icon} size={16} /> {label}
    </button>
  );
}

const NIP_RE = /^\d{10}$/;

export function AuthForm({ mode, onMode, onDone }: { mode: AuthMode; onMode: (m: AuthMode) => void; onDone?: () => void }) {
  const router = useRouter();
  const isReg = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PRIVATE');
  const [companyName, setCompanyName] = useState('');
  const [nip, setNip] = useState('');
  const [accept, setAccept] = useState(false);
  const [s1, setS1] = useState(false);
  const [s2, setS2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isBusiness = accountType === 'BUSINESS';

  function validate(): string | null {
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return 'Podaj poprawny adres e-mail.';
    if (password.length < 8) return 'Hasło musi mieć min. 8 znaków.';
    if (isReg) {
      if (displayName.trim().length < 2) return isBusiness ? 'Podaj nazwę wyświetlaną.' : 'Podaj imię lub nazwę.';
      if (password !== confirm) return 'Hasła nie są takie same.';
      if (isBusiness) {
        if (companyName.trim().length < 2) return 'Podaj nazwę firmy.';
        if (!NIP_RE.test(nip.trim())) return 'NIP musi mieć 10 cyfr.';
      }
      if (!accept) return 'Zaakceptuj regulamin.';
    }
    return null;
  }

  async function submit() {
    // Rejestracja celowo WYŁĄCZONA na tym etapie (Etap 1) — formularz jest tylko widokiem.
    // Konta testowe/admin zakładane bezpośrednio w bazie; pełna rejestracja: Etap 2/3 (z e-mailem).
    if (isReg) { setError('Rejestracja będzie wkrótce dostępna. Konta zakłada administrator.'); return; }
    const err = validate();
    if (err) { setError(err); return; }
    setBusy(true);
    setError('');
    try {
      if (isReg) {
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          accountType,
          ...(isBusiness ? { companyName: companyName.trim(), nip: nip.trim() } : {}),
        });
      } else {
        await signIn(email.trim(), password);
      }
      if (onDone) onDone();
      else router.push('/');
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-pill bg-gold-soft text-gold flex items-center justify-center mx-auto mb-4"><Icon name={isReg ? 'userPlus' : 'lock'} size={24} /></div>
        <h1 className="font-serif text-3xl font-semibold text-ink">{isReg ? 'Załóż konto' : 'Zaloguj się'}</h1>
        <p className="text-sm text-muted mt-2 max-w-xs mx-auto">{isReg ? 'Dołącz do AdBox i odkrywaj świat mody.' : 'Witaj ponownie! Zaloguj się, aby kontynuować.'}</p>
      </div>

      {isReg && (
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setAccountType('PRIVATE')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!isBusiness ? 'bg-gold-soft border-gold text-gold' : 'card-surface text-ink-soft'}`}>
            Osoba prywatna
          </button>
          <button type="button" onClick={() => setAccountType('BUSINESS')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isBusiness ? 'bg-gold-soft border-gold text-gold' : 'card-surface text-ink-soft'}`}>
            Firma
          </button>
        </div>
      )}

      <div className="space-y-4">
        {isReg && (
          <Field label={isBusiness ? 'Nazwa wyświetlana' : 'Imię / nazwa'} placeholder={isBusiness ? 'Np. Twoja marka' : 'Jak Cię wyświetlać?'}
            value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        )}
        <Field label="E-mail" placeholder="Wprowadź adres e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} right={<Icon name="mail" size={16} />} />
        <Field label="Hasło" placeholder="Wprowadź hasło" type={s1 ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} right={<button type="button" onClick={() => setS1(!s1)}><Icon name="eye" size={16} /></button>} />
        {isReg && (
          <Field label="Potwierdź hasło" placeholder="Potwierdź hasło" type={s2 ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} right={<button type="button" onClick={() => setS2(!s2)}><Icon name="eye" size={16} /></button>} />
        )}
        {isReg && isBusiness && (
          <>
            <Field label="Nazwa firmy" placeholder="Pełna nazwa firmy" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Field label="NIP" placeholder="10 cyfr" value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </>
        )}
      </div>

      {isReg ? (
        <label className="flex items-center gap-2 text-[13px] text-ink-soft mt-4 cursor-pointer">
          <input type="checkbox" className="accent-gold w-4 h-4" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span>Akceptuję <a className="text-gold font-semibold">Regulamin</a> oraz <a className="text-gold font-semibold">Politykę prywatności</a>.</span>
        </label>
      ) : (
        <div className="flex items-center justify-between mt-3 text-[13px]">
          <label className="flex items-center gap-2 text-ink-soft cursor-pointer"><input type="checkbox" className="accent-gold w-4 h-4" /> Zapamiętaj mnie</label>
          <button type="button" className="text-gold font-semibold">Nie pamiętasz hasła?</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-4 text-center whitespace-pre-line">{error}</p>}

      <button type="button" onClick={submit} disabled={busy} className="btn-gold w-full py-3 text-white mt-5 disabled:opacity-60">
        {busy ? 'Proszę czekać…' : isReg ? 'Załóż konto' : 'Zaloguj się'}
      </button>

      <div className="flex items-center gap-3 my-5 text-xs text-muted">
        <span className="flex-1 h-px bg-line" /> lub kontynuuj z <span className="flex-1 h-px bg-line" />
      </div>
      <div className="flex gap-2.5">
        <Social label="Google" icon="user" />
        <Social label="Apple" icon="user" />
      </div>

      <p className="text-center text-sm text-muted mt-6">
        {isReg ? 'Masz już konto? ' : 'Nie masz konta? '}
        <button type="button" onClick={() => onMode(isReg ? 'login' : 'register')} className="text-gold font-semibold">
          {isReg ? 'Zaloguj się' : 'Załóż konto'}
        </button>
      </p>
    </div>
  );
}
