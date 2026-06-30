'use client';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../components/ui/Icon';
import { AccountLayout } from '../components/layout/AccountLayout';

const SETTINGS: { icon: IconName; title: string; sub: string; href: string }[] = [
  { icon: 'user', title: 'Dane osobowe', sub: 'Imię, nazwisko, e-mail, telefon', href: '/ustawienia/dane' },
  { icon: 'lock', title: 'Hasło i bezpieczeństwo', sub: 'Zmień hasło, weryfikacja dwuetapowa', href: '/ustawienia/bezpieczenstwo' },
  { icon: 'bell', title: 'Powiadomienia', sub: 'Zarządzaj powiadomieniami push i e-mail', href: '/ustawienia/powiadomienia' },
  { icon: 'shield', title: 'Prywatność', sub: 'Ustawienia widoczności i danych', href: '/ustawienia/prywatnosc' },
  { icon: 'sliders', title: 'Preferencje', sub: 'Język, waluta, jednostki miary', href: '/ustawienia/preferencje' },
  { icon: 'mapPin', title: 'Adresy', sub: 'Zarządzaj adresami dostawy i płatności', href: '/ustawienia/adresy' },
  { icon: 'truck', title: 'Wysyłki', sub: 'Wybierz przewoźników: InPost, DPD, Poczta…', href: '/ustawienia/wysylki' },
  { icon: 'card', title: 'Płatności', sub: 'Konto do wypłat i metody płatności', href: '/ustawienia/platnosci' },
];

function Row({ s, onClick }: { s: { icon: IconName; title: string; sub: string }; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors">
      <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={s.icon} size={19} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{s.title}</span>
        <span className="block text-[12px] text-muted">{s.sub}</span>
      </span>
      <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
    </button>
  );
}

export function SettingsPage() {
  const router = useRouter();
  return (
    <AccountLayout active="ustawienia">
      {/* nagłówek mobilny */}
      <div className="md:hidden flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-ink"><Icon name="arrowLeft" size={20} /></button>
        <h1 className="font-serif text-lg font-semibold text-ink flex-1 text-center pr-6">Ustawienia konta</h1>
      </div>
      <h1 className="hidden md:block font-serif text-2xl font-semibold text-ink mb-6">Ustawienia konta</h1>

      <div className="card-surface divide-y divide-line overflow-hidden md:max-w-2xl">
        {SETTINGS.map((s) => <Row key={s.title} s={s} onClick={() => router.push(s.href)} />)}
      </div>
    </AccountLayout>
  );
}
