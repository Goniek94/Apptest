'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IMG } from '@modamarket/shared';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useCurrentUser } from '../../lib/auth';
import { updateMe } from '../../lib/api/users';

/* ---------- wspólne klocki ---------- */
function Toggle({ initial }: { initial?: boolean }) {
  const [on, setOn] = useState(!!initial);
  return (
    <button onClick={() => setOn((o) => !o)} className={`w-11 h-6 rounded-pill p-0.5 shrink-0 transition-colors ${on ? 'bg-gold' : 'bg-line'}`}>
      <span className={`block w-5 h-5 rounded-pill bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function Shell({ title, save, children }: { title: string; save?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="w-full max-w-[760px] mx-auto px-4 py-5 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-ink"><Icon name="arrowLeft" size={20} /></button>
        <h1 className="font-serif text-xl font-semibold text-ink flex-1 text-center pr-6">{title}</h1>
      </div>
      <div className="space-y-4">{children}</div>
      {save && <button className="btn-gold w-full py-3.5 text-white font-semibold mt-5">{save}</button>}
    </div>
  );
}

function Card({ label, children, className = '' }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-line rounded-2xl overflow-hidden ${className}`}>
      {label && <div className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-gold">{label}</div>}
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

function Circle({ icon }: { icon: IconName }) {
  return <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={icon} size={18} /></span>;
}

function ToggleRow({ icon, title, sub, initial }: { icon: IconName; title: string; sub?: string; initial?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <Circle icon={icon} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        {sub && <div className="text-[12px] text-muted">{sub}</div>}
      </div>
      <Toggle initial={initial} />
    </div>
  );
}

function NavRow({ icon, title, sub, danger }: { icon: IconName; title: string; sub?: string; danger?: boolean }) {
  return (
    <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
      <span className={`w-11 h-11 rounded-pill flex items-center justify-center shrink-0 ${danger ? 'bg-danger/10 text-danger' : 'bg-gold-soft text-gold'}`}><Icon name={icon} size={18} /></span>
      <div className="flex-1 min-w-0">
        <div className={`text-[15px] font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</div>
        {sub && <div className="text-[12px] text-muted">{sub}</div>}
      </div>
      <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
    </button>
  );
}

function DropdownPill({ options, initial }: { options: string[]; initial?: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(initial ?? options[0]);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 bg-gold-soft/60 rounded-pill px-3.5 py-1.5 text-[13px] font-semibold text-ink">
        {v} <Icon name="chevronDown" size={14} className="text-muted" />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-label="Zamknij" />
          <div className="absolute right-0 top-9 z-40 w-44 card-surface p-1.5 shadow-[0_16px_40px_rgba(40,30,20,0.14)]">
            {options.map((o) => (
              <button key={o} onClick={() => { setV(o); setOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${o === v ? 'bg-gold-soft text-ink font-semibold' : 'text-ink-soft hover:bg-bg'}`}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PwField({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-2">{label}</span>
      <div className="relative flex items-center">
        <input type={show ? 'text' : 'password'} className="input-base pr-11" placeholder={label} />
        <button onClick={() => setShow((s) => !s)} className="absolute right-3 text-muted"><Icon name="eye" size={17} /></button>
      </div>
    </label>
  );
}

function TextField({ label, value, icon = 'edit' }: { label: string; value: string; icon?: IconName }) {
  return (
    <label className="block">
      <span className="block text-[13px] text-muted mb-1.5">{label}</span>
      <div className="relative flex items-center">
        <input defaultValue={value} className="input-base pr-11" />
        <Icon name={icon} size={16} className="absolute right-4 text-muted" />
      </div>
    </label>
  );
}

/* ===================== EKRANY ===================== */

export function DataPage() {
  const { user } = useCurrentUser();
  const isBusiness = user?.accountType === 'BUSINESS';
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nip, setNip] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setCompanyName(user.companyName ?? '');
    setNip(user.nip ?? '');
  }, [user]);

  async function save() {
    setMsg('');
    if (displayName.trim().length < 2) { setMsg('Nazwa musi mieć min. 2 znaki.'); return; }
    setBusy(true);
    try {
      await updateMe({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        ...(isBusiness ? { companyName: companyName.trim() || undefined, nip: nip.trim() || undefined } : {}),
      });
      setMsg('Zapisano zmiany.');
    } catch (e: any) {
      setMsg(e?.message ?? 'Nie udało się zapisać.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Dane osobowe">
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-5">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-[88px] h-[88px] rounded-pill object-cover" />
            ) : (
              <span className="w-[88px] h-[88px] rounded-pill bg-gold-soft flex items-center justify-center font-serif text-2xl font-bold text-gold">{(user?.displayName ?? '?').charAt(0).toUpperCase()}</span>
            )}
            <button className="flex items-center gap-2 text-gold font-semibold text-sm"><span className="w-12 h-12 rounded-pill border border-gold/40 flex items-center justify-center"><Icon name="camera" size={18} /></span> Zmień zdjęcie</button>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-[13px] text-muted mb-1.5">Nazwa wyświetlana</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-base" />
            </label>
            <label className="block">
              <span className="block text-[13px] text-muted mb-1.5">O mnie</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 500))} className="input-base h-24 resize-none" placeholder="Krótki opis (widoczny na profilu)" />
            </label>
            <label className="block">
              <span className="block text-[13px] text-muted mb-1.5">E-mail</span>
              <input value={user?.email ?? ''} disabled className="input-base opacity-60 cursor-not-allowed" />
            </label>
            {isBusiness && (
              <>
                <label className="block">
                  <span className="block text-[13px] text-muted mb-1.5">Nazwa firmy</span>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-base" />
                </label>
                <label className="block">
                  <span className="block text-[13px] text-muted mb-1.5">NIP</span>
                  <input value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))} className="input-base" />
                </label>
              </>
            )}
          </div>
          {msg && <p className="text-sm text-center mt-4 text-gold">{msg}</p>}
          <button onClick={save} disabled={busy} className="btn-gold w-full py-3.5 text-white font-semibold mt-5 disabled:opacity-60">{busy ? 'Zapisywanie…' : 'Zapisz zmiany'}</button>
        </div>
      </Card>
    </Shell>
  );
}

export function SecurityPage() {
  return (
    <Shell title="Hasło i bezpieczeństwo" save="Zapisz ustawienia">
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Circle icon="lock" />
            <div>
              <div className="text-[15px] font-semibold text-ink">Zmień hasło</div>
              <div className="text-[12px] text-muted">Regularna zmiana hasła zwiększa bezpieczeństwo konta.</div>
            </div>
          </div>
          <div className="space-y-4">
            <PwField label="Obecne hasło" />
            <PwField label="Nowe hasło" />
            <PwField label="Powtórz nowe hasło" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3.5 flex items-center gap-3.5">
          <Circle icon="shield" />
          <div className="text-[15px] font-semibold text-ink">Bezpieczeństwo konta</div>
        </div>
        <ToggleRow icon="lock" title="Weryfikacja dwuetapowa" sub="Dodatkowa ochrona podczas logowania" />
        <ToggleRow icon="eye" title="Logowanie biometryczne" sub="Zaloguj się szybciej i bezpieczniej" />
      </Card>

      <Card>
        <div className="px-4 py-3.5 flex items-center gap-3.5">
          <Circle icon="monitor" />
          <div>
            <div className="text-[15px] font-semibold text-ink">Aktywne urządzenia</div>
            <div className="text-[12px] text-muted">Zarządzaj urządzeniami, na których jesteś zalogowany.</div>
          </div>
        </div>
        <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
          <Circle icon="smartphone" />
          <div className="flex-1"><div className="text-[15px] font-semibold text-ink flex items-center gap-2">iPhone 14 Pro <span className="text-[10px] bg-gold-soft text-gold-deep px-2 py-0.5 rounded-pill font-semibold">To urządzenie</span></div><div className="text-[12px] text-muted">Polska · Warszawa · Teraz</div></div>
          <Icon name="chevronRight" size={18} className="text-muted" />
        </button>
        <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
          <Circle icon="monitor" />
          <div className="flex-1"><div className="text-[15px] font-semibold text-ink">MacBook Air (M2)</div><div className="text-[12px] text-muted">Polska · Kraków · 2 dni temu</div></div>
          <Icon name="chevronRight" size={18} className="text-muted" />
        </button>
      </Card>
    </Shell>
  );
}

export function NotificationsPage() {
  return (
    <Shell title="Powiadomienia" save="Zapisz preferencje">
      <Card>
        <div className="px-4 py-3.5 flex items-center gap-2.5"><Icon name="bell" size={18} className="text-gold" /><span className="font-serif text-base font-semibold text-ink">Aplikacja</span></div>
        <ToggleRow icon="chat" title="Wiadomości" initial />
        <ToggleRow icon="tag" title="Nowe oferty" />
        <ToggleRow icon="heart" title="Obserwowane produkty" initial />
        <ToggleRow icon="box" title="Status zamówień" initial />
      </Card>
      <Card>
        <div className="px-4 py-3.5 flex items-center gap-2.5"><Icon name="mail" size={18} className="text-gold" /><span className="font-serif text-base font-semibold text-ink">E-mail</span></div>
        <ToggleRow icon="tag" title="Promocje" initial />
        <ToggleRow icon="star" title="Nowości" />
        <ToggleRow icon="user" title="Aktualizacje konta" initial />
      </Card>
      <Card>
        <div className="px-4 py-3.5 flex items-center gap-2.5"><Icon name="chat" size={18} className="text-gold" /><span className="font-serif text-base font-semibold text-ink">SMS</span></div>
        <ToggleRow icon="shield" title="Ważne zamówienia" initial />
      </Card>
      <p className="flex items-start gap-2 text-[12px] text-muted px-1"><Icon name="help" size={14} className="text-gold shrink-0 mt-0.5" /> Zarządzaj, jakimi kanałami chcesz otrzymywać powiadomienia. Zmiany zapisujemy tylko dla Ciebie.</p>
    </Shell>
  );
}

export function PrivacyPage() {
  return (
    <Shell title="Prywatność" save="Zapisz ustawienia">
      <Card label="Ustawienia prywatności">
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          <Circle icon="eye" />
          <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold text-ink">Widoczność profilu</div><div className="text-[12px] text-muted">Kto może zobaczyć Twój profil</div></div>
          <DropdownPill options={['Publiczny', 'Tylko obserwujący', 'Prywatny']} />
        </div>
        <ToggleRow icon="bag" title="Ukryj sprzedane ogłoszenia" sub="Twoje sprzedane przedmioty będą ukryte" />
        <ToggleRow icon="star" title="Pokazuj opinie" sub="Zezwalaj innym na przeglądanie opinii o Tobie" initial />
        <ToggleRow icon="clock" title="Widoczność ostatniej aktywności" sub="Pokaż innym, kiedy byłeś(-aś) ostatnio aktywny(-a)" />
        <ToggleRow icon="chat" title="Zezwalaj na wiadomości od użytkowników" sub="Inni użytkownicy będą mogli do Ciebie pisać" initial />
      </Card>
      <Card label="Twoje dane">
        <NavRow icon="download" title="Pobierz moje dane" sub="Pobierz kopię swoich danych z ModaMarket" />
        <NavRow icon="trash" title="Usuń konto" sub="Trwale usuń swoje konto i dane z naszej aplikacji" danger />
      </Card>
    </Shell>
  );
}

function CatChip({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-1.5 border border-gold/40 text-gold rounded-pill px-3 py-1.5 text-[12px] font-medium">{label} <Icon name="x" size={12} /></span>;
}

export function PreferencesPage() {
  return (
    <Shell title="Preferencje" save="Zapisz preferencje">
      <Card>
        <div className="flex items-center gap-3.5 px-4 py-4"><Circle icon="globe" /><span className="flex-1 text-[15px] font-semibold text-ink">Język</span><DropdownPill options={['Polski', 'English', 'Deutsch']} /></div>
        <div className="flex items-center gap-3.5 px-4 py-4"><Circle icon="wallet" /><span className="flex-1 text-[15px] font-semibold text-ink">Waluta</span><DropdownPill options={['PLN', 'EUR', 'USD']} /></div>
        <div className="flex items-center gap-3.5 px-4 py-4"><Circle icon="sliders" /><span className="flex-1 text-[15px] font-semibold text-ink">Jednostki rozmiaru</span><DropdownPill options={['EU', 'UK', 'US']} /></div>
        <div className="flex items-center gap-3.5 px-4 py-4"><Circle icon="sun" /><span className="flex-1 text-[15px] font-semibold text-ink">Tryb wyświetlania</span><DropdownPill options={['Jasny', 'Ciemny', 'Systemowy']} /></div>
        <div className="flex items-start gap-3.5 px-4 py-4">
          <Circle icon="bag" />
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-ink mb-2">Preferowane kategorie</div>
            <div className="flex flex-wrap gap-2">
              <CatChip label="Torebki" /><CatChip label="Sneakersy" /><CatChip label="Płaszcze" />
              <button className="w-8 h-8 rounded-pill border border-dashed border-line flex items-center justify-center text-muted"><Icon name="plus" size={14} /></button>
            </div>
          </div>
        </div>
        <ToggleRow icon="search" title="Preferencje wyszukiwania" sub="Tylko zweryfikowane" initial />
      </Card>
    </Shell>
  );
}

function AddressCard({ badge, badgeIcon, name, lines, phone }: { badge?: string; badgeIcon?: IconName; name: string; lines: string[]; phone: string }) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between">
        {badge ? <span className="inline-flex items-center gap-1.5 border border-gold/40 text-gold rounded-pill px-3 py-1 text-[12px] font-semibold">{badgeIcon && <Icon name={badgeIcon} size={13} />} {badge}</span> : <span />}
        <button className="w-9 h-9 rounded-pill bg-gold-soft text-gold flex items-center justify-center"><Icon name="edit" size={15} /></button>
      </div>
      <div className="font-semibold text-ink mt-3">{name}</div>
      {lines.map((l) => <div key={l} className="text-[14px] text-muted">{l}</div>)}
      <div className="border-t border-line mt-3 pt-3 text-[14px] text-muted">{phone}</div>
    </div>
  );
}

export function AddressesPage() {
  return (
    <Shell title="Adresy" save="Zapisz zmiany">
      <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/50 text-gold font-semibold py-4"><Icon name="plus" size={18} /> Dodaj adres</button>
      <AddressCard badge="Domyślny" badgeIcon="star" name="Anna Kowalska" lines={['ul. Kwiatowa 12/4', '00-001 Warszawa', 'Polska']} phone="+48 600 123 456" />
      <AddressCard badge="Biuro" badgeIcon="box" name="Anna Kowalska" lines={['ul. Prosta 18', '00-850 Warszawa', 'Polska']} phone="+48 600 987 654" />
      <AddressCard name="Anna Kowalska" lines={['ul. Słoneczna 7', '30-001 Kraków', 'Polska']} phone="+48 600 456 789" />
    </Shell>
  );
}

function CarrierRow({ name, initial }: { name: string; initial?: boolean }) {
  const [on, setOn] = useState(!!initial);
  return (
    <button onClick={() => setOn((o) => !o)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
      <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name="truck" size={17} /></span>
      <span className="flex-1 text-[15px] font-medium text-ink">{name}</span>
      <span className={`w-6 h-6 rounded-pill flex items-center justify-center ${on ? 'bg-gold text-white' : 'border-2 border-line'}`}>{on && <Icon name="check" size={13} />}</span>
    </button>
  );
}

export function ShippingPage() {
  const [size, setSize] = useState('Średni');
  return (
    <Shell title="Wysyłki" save="Zapisz ustawienia">
      <Card>
        <div className="px-4 pt-4 pb-1"><div className="text-[15px] font-semibold text-ink">Domyślni przewoźnicy</div><div className="text-[12px] text-muted">Wybierz przewoźników, których chcesz używać</div></div>
        <CarrierRow name="InPost" initial />
        <CarrierRow name="DPD" initial />
        <CarrierRow name="Poczta Polska" />
        <CarrierRow name="DHL" />
      </Card>
      <Card>
        <div className="px-4 pt-4 pb-1"><div className="text-[15px] font-semibold text-ink">Nadawca</div><div className="text-[12px] text-muted">Dane nadawcy będą widoczne na etykiecie</div></div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 border border-line rounded-xl px-3.5 py-2.5"><Circle icon="user" /><div className="flex-1"><div className="text-[11px] text-muted">Imię i nazwisko</div><div className="text-[14px] font-medium text-ink">ModaMarket</div></div><Icon name="edit" size={15} className="text-muted" /></div>
          <div className="flex items-center gap-3 border border-line rounded-xl px-3.5 py-2.5"><Circle icon="bell" /><div className="flex-1"><div className="text-[11px] text-muted">Telefon kontaktowy</div><div className="text-[14px] font-medium text-ink">+48 600 123 456</div></div><Icon name="edit" size={15} className="text-muted" /></div>
        </div>
      </Card>
      <Card>
        <div className="px-4 pt-4 pb-1"><div className="text-[15px] font-semibold text-ink">Domyślny rozmiar przesyłki</div><div className="text-[12px] text-muted">Wybierz rozmiar używany najczęściej</div></div>
        <div className="p-4 grid grid-cols-3 gap-2.5">
          {['Mały', 'Średni', 'Duży'].map((s) => (
            <button key={s} onClick={() => setSize(s)} className={`py-2.5 rounded-pill border text-[13px] font-semibold transition-colors ${size === s ? 'border-gold text-gold bg-gold-soft/40' : 'border-line text-ink-soft'}`}>{s}</button>
          ))}
        </div>
      </Card>
      <Card><ToggleRow icon="tag" title="Automatycznie generuj etykietę" sub="Po utworzeniu zamówienia etykieta zostanie wygenerowana automatycznie" initial /></Card>
    </Shell>
  );
}

function PayCard({ brand, info, badge }: { brand: string; info: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 border border-line rounded-xl px-3.5 py-3">
      <span className="w-10 h-7 rounded bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name="card" size={15} /></span>
      <div className="flex-1 min-w-0"><div className="text-[14px] font-semibold text-ink">{brand}</div><div className="text-[12px] text-muted">{info}</div></div>
      {badge && <span className="text-[10px] bg-gold-soft text-gold-deep px-2 py-0.5 rounded-pill font-semibold">{badge}</span>}
      <button className="text-muted"><Icon name="dots" size={18} /></button>
    </div>
  );
}

export function PaymentsPage() {
  return (
    <Shell title="Płatności" save="Zapisz ustawienia">
      <Card>
        <div className="p-4">
          <div className="flex items-start gap-3.5 mb-3"><Circle icon="card" /><div><div className="text-[15px] font-semibold text-ink">Konto do wypłat</div><div className="text-[12px] text-muted">Środki z wypłat będą przekazywane na poniższe konto bankowe.</div></div></div>
          <button className="w-full flex items-center gap-3 border border-line rounded-xl px-3.5 py-3 text-left"><span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center"><Icon name="bank" size={17} /></span><div className="flex-1"><div className="text-[14px] font-semibold text-ink">PKO Bank Polski</div><div className="text-[12px] text-muted">12 1020 **** **** **** 7890 12</div></div><Icon name="chevronRight" size={16} className="text-muted" /></button>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <div className="flex items-start gap-3.5 mb-3"><Circle icon="card" /><div><div className="text-[15px] font-semibold text-ink">Metody płatności</div><div className="text-[12px] text-muted">Zarządzaj zapisanymi metodami płatności.</div></div></div>
          <div className="space-y-2.5">
            <PayCard brand="Mastercard •••• 1234" info="11/27" badge="Domyślna" />
            <PayCard brand="Visa •••• 5678" info="08/28" />
            <PayCard brand="BLIK" info="Szybkie płatności" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <div className="flex items-start gap-3.5 mb-3"><Circle icon="star" /><div><div className="text-[15px] font-semibold text-ink">Preferowana metoda</div><div className="text-[12px] text-muted">Metoda wybrana do płatności domyślnych.</div></div></div>
          <div className="flex items-center gap-3 border border-line rounded-xl px-3.5 py-3"><span className="w-10 h-7 rounded bg-gold-soft text-gold flex items-center justify-center"><Icon name="card" size={15} /></span><div className="flex-1"><div className="text-[14px] font-semibold text-ink">Mastercard •••• 1234</div><div className="text-[12px] text-muted">11/27</div></div><span className="w-6 h-6 rounded-pill bg-gold text-white flex items-center justify-center"><Icon name="check" size={13} /></span></div>
        </div>
      </Card>
      <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/50 text-gold font-semibold py-4"><Icon name="plus" size={18} /> Dodaj metodę płatności</button>
    </Shell>
  );
}
