'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { grosze } from '@modamarket/shared';
import { Icon } from '../components/ui/Icon';
import { AccountLayout } from '../components/layout/AccountLayout';
import { fetchMyListings, deleteListing, type ApiListing } from '../lib/api/listings';
import { useCurrentUser, openAuth } from '../lib/auth';

const TOP_TABS = ['Wszystkie', 'Aktywne', 'Zarezerwowane', 'Zakończone'] as const;
type TopTab = typeof TOP_TABS[number];

const STATUS_META: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'Aktywne', tone: 'bg-success/12 text-success' },
  RESERVED: { label: 'Zarezerwowane', tone: 'bg-gold-soft text-gold-deep' },
  SOLD: { label: 'Sprzedane', tone: 'bg-[#E6EEF6] text-[#3B6CA8]' },
  ARCHIVED: { label: 'Zarchiwizowane', tone: 'bg-line text-muted' },
  DRAFT: { label: 'Szkic', tone: 'bg-line text-muted' },
};

function ListingRow({ it, onOpen, onDelete }: { it: ApiListing; onOpen: () => void; onDelete: () => void }) {
  const b = STATUS_META[it.status] ?? { label: it.status, tone: 'bg-line text-muted' };
  const img = it.images?.[0]?.url ?? '';
  return (
    <div className="card-surface p-3 flex gap-3 items-center hover:border-gold/50 transition-colors">
      <div onClick={onOpen} className="w-[84px] h-[104px] rounded-lg bg-gold-soft bg-cover bg-center shrink-0 cursor-pointer" style={{ backgroundImage: `url('${img}')` }} />
      <div className="flex-1 min-w-0 self-stretch flex flex-col cursor-pointer" onClick={onOpen}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-serif text-[15px] font-semibold text-ink leading-tight truncate">{it.title}</div>
            <div className="text-[12px] text-muted uppercase tracking-wide mt-0.5">{it.brand ?? '—'}</div>
            <div className="font-serif text-[17px] font-bold text-ink mt-1">{grosze(it.price)}</div>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-pill whitespace-nowrap flex items-center gap-1.5 shrink-0 ${b.tone}`}>
            <span className="w-1.5 h-1.5 rounded-pill bg-current opacity-70" /> {b.label}
          </span>
        </div>
        <div className="mt-auto pt-2 flex items-center gap-1.5 text-[12px] text-muted">
          <Icon name="box" size={13} /> {it.quantity > 1 ? `${it.quantity} szt.` : '1 szt.'}{it.groupBuy ? ' · Kup w grupie' : ''}
        </div>
      </div>
      <button onClick={onDelete} className="w-9 h-9 rounded-pill border border-line flex items-center justify-center text-muted hover:text-danger hover:border-danger transition-colors shrink-0" aria-label="Usuń">
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

export function MyListingsPage() {
  const router = useRouter();
  const { user, hydrated } = useCurrentUser();
  const [all, setAll] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [top, setTop] = useState<TopTab>('Wszystkie');

  const load = () => {
    fetchMyListings().then(setAll).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { setLoading(false); return; }
    load();
  }, [user, hydrated]);

  const items = useMemo(() => all.filter((it) => {
    if (top === 'Wszystkie') return true;
    if (top === 'Aktywne') return it.status === 'ACTIVE';
    if (top === 'Zarezerwowane') return it.status === 'RESERVED';
    return it.status === 'SOLD' || it.status === 'ARCHIVED';
  }), [all, top]);

  const remove = async (id: string) => {
    if (!confirm('Usunąć to ogłoszenie?')) return;
    setAll((prev) => prev.filter((l) => l.id !== id));
    try { await deleteListing(id); } catch { load(); }
  };

  return (
    <AccountLayout active="oferty">
      <div>
        <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink mb-4 md:mb-6">Moje ogłoszenia</h1>

        <div className="card-surface p-1.5 flex gap-1 mb-5">
          {TOP_TABS.map((t) => (
            <button key={t} onClick={() => setTop(t)} className={`flex-1 py-2 rounded-pill text-[13px] font-semibold transition-colors ${top === t ? 'bg-gold-soft text-gold-deep' : 'text-ink-soft hover:bg-bg'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {!user && hydrated ? (
            <div className="card-surface py-12 text-center text-muted text-sm">
              Zaloguj się, aby zobaczyć swoje ogłoszenia.
              <button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button>
            </div>
          ) : loading ? (
            <div className="card-surface py-12 text-center text-muted text-sm">Wczytywanie…</div>
          ) : items.length > 0 ? (
            items.map((it) => <ListingRow key={it.id} it={it} onOpen={() => router.push(`/produkt/${it.id}`)} onDelete={() => remove(it.id)} />)
          ) : (
            <div className="card-surface py-12 text-center text-muted text-sm">Brak ogłoszeń w tej zakładce.</div>
          )}
        </div>

        <button onClick={() => router.push('/sprzedaj')} className="btn-gold w-full py-3.5 text-white font-semibold mt-5">
          <Icon name="plus" size={18} /> Dodaj ogłoszenie
        </button>
      </div>
    </AccountLayout>
  );
}
