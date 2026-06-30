'use client';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../components/ui/Icon';

const FAQ: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'bag', title: 'Jak kupować?', sub: 'Zamawianie, płatność i odbiór' },
  { icon: 'tag', title: 'Jak sprzedawać?', sub: 'Dodawanie ogłoszeń i wysyłka' },
  { icon: 'wallet', title: 'Płatności i wypłaty', sub: 'Metody płatności, konto do wypłat' },
  { icon: 'truck', title: 'Wysyłka i zwroty', sub: 'Przewoźnicy, koszty, zwroty 14 dni' },
  { icon: 'shield', title: 'Bezpieczeństwo konta', sub: 'Ochrona kupujących i danych' },
];

const CONTACT: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'chat', title: 'Napisz do nas', sub: 'Czat z obsługą klienta' },
  { icon: 'mail', title: 'E-mail', sub: 'pomoc@modamarket.pl' },
  { icon: 'flag', title: 'Zgłoś problem', sub: 'Oszustwo, błąd lub nadużycie' },
];

export function HelpPage() {
  const router = useRouter();
  return (
    <div className="w-full max-w-[760px] mx-auto px-4 py-5 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-ink"><Icon name="arrowLeft" size={20} /></button>
        <h1 className="font-serif text-xl font-semibold text-ink flex-1 text-center pr-6">Pomoc</h1>
      </div>

      <div className="flex items-center gap-2 bg-surface border border-line rounded-pill px-4 py-3 mb-6">
        <Icon name="search" size={18} className="text-muted" />
        <input placeholder="Jak możemy pomóc?" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" />
      </div>

      <h2 className="font-serif text-lg font-semibold text-ink mb-3">Najczęstsze pytania</h2>
      <div className="card-surface divide-y divide-line overflow-hidden mb-6">
        {FAQ.map((f) => (
          <button key={f.title} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
            <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={f.icon} size={18} /></span>
            <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold text-ink">{f.title}</div><div className="text-[12px] text-muted">{f.sub}</div></div>
            <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
          </button>
        ))}
      </div>

      <h2 className="font-serif text-lg font-semibold text-ink mb-3">Kontakt</h2>
      <div className="card-surface divide-y divide-line overflow-hidden mb-6">
        {CONTACT.map((c) => (
          <button key={c.title} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
            <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={c.icon} size={18} /></span>
            <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold text-ink">{c.title}</div><div className="text-[12px] text-muted">{c.sub}</div></div>
            <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-[13px] text-muted">
        <button className="hover:text-gold">Regulamin</button>
        <button className="hover:text-gold">Polityka prywatności</button>
        <button className="hover:text-gold">O ModaMarket</button>
      </div>
    </div>
  );
}
