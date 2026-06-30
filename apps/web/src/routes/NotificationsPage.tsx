'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../components/ui/Icon';
import { AccountLayout } from '../components/layout/AccountLayout';
import { useCurrentUser, openAuth } from '../lib/auth';
import { fetchNotifications, markAllNotifRead, type AppNotification } from '../lib/api/notifications';

const zl = (g?: number) => (typeof g === 'number' ? `${(g / 100).toFixed(2).replace('.', ',')} zł` : '');
const GOLD = '#C0913C';

type Meta = { icon: IconName; tone: string; title: string | ((p: any) => string); sub?: (p: any) => string; href?: (p: any) => string };

const META: Record<string, Meta> = {
  LISTING_PUBLISHED: { icon: 'check', tone: '#2A7A4A', title: 'Twoje ogłoszenie zostało opublikowane', sub: (p) => p?.title ?? '', href: (p) => (p?.listingId ? `/produkt/${p.listingId}` : '') },
  LISTING_HIDDEN: { icon: 'eye', tone: '#B23B36', title: 'Twoje ogłoszenie zostało ukryte — sprawdź szczegóły', sub: (p) => p?.title ?? '', href: () => '/moje-ogloszenia' },
  LISTING_LIKED: { icon: 'heart', tone: GOLD, title: 'Twoje ogłoszenie zostało polubione', sub: (p) => p?.title ?? '', href: (p) => (p?.listingId ? `/produkt/${p.listingId}` : '') },
  ACCOUNT_BANNED: { icon: 'shield', tone: '#B23B36', title: 'Twoje konto zostało zablokowane', sub: () => 'Skontaktuj się z obsługą, aby poznać szczegóły.' },
  ACCOUNT_UNBANNED: { icon: 'shield', tone: '#2A7A4A', title: 'Twoje konto zostało odblokowane' },
  ORDER_SOLD: { icon: 'box', tone: '#2A7A4A', title: 'Twój przedmiot został sprzedany. Gratulacje!', sub: (p) => p?.title ?? '', href: () => '/portfel' },
  PAYOUT_SUCCESS: { icon: 'wallet', tone: '#2A7A4A', title: 'Twoja wypłata przebiegła pomyślnie', sub: (p) => zl(p?.amount), href: () => '/portfel' },
  OFFER_RECEIVED: { icon: 'tag', tone: GOLD, title: 'Otrzymałeś ofertę cenową', sub: (p) => zl(p?.amount), href: () => '/wiadomosci' },
  OFFER_ACCEPTED: { icon: 'check', tone: '#2A7A4A', title: 'Twoja oferta została zaakceptowana', sub: (p) => zl(p?.amount), href: () => '/wiadomosci' },
  OFFER_REJECTED: { icon: 'x', tone: '#B23B36', title: 'Twoja oferta została odrzucona', href: () => '/wiadomosci' },
  OFFER_COUNTERED: { icon: 'tag', tone: GOLD, title: 'Otrzymałeś kontrofertę', sub: (p) => zl(p?.amount), href: () => '/wiadomosci' },
  MESSAGE: { icon: 'chat', tone: GOLD, title: (p) => (p?.fromName ? `Masz nową wiadomość od ${p.fromName}` : 'Masz nową wiadomość'), href: (p) => (p?.conversationId ? `/wiadomosci?c=${p.conversationId}` : '/wiadomosci') },
  RESERVATION_REQUESTED: { icon: 'clock', tone: GOLD, title: 'Masz nową prośbę o rezerwację', sub: (p) => p?.title ?? '', href: () => '/wiadomosci' },
  RESERVATION_ACCEPTED: { icon: 'check', tone: '#2A7A4A', title: 'Twoja rezerwacja została zaakceptowana', href: () => '/wiadomosci' },
  RESERVATION_REJECTED: { icon: 'x', tone: '#B23B36', title: 'Twoja prośba o rezerwację została odrzucona', href: () => '/wiadomosci' },
  RESERVATION_CANCELLED: { icon: 'clock', tone: '#9A9387', title: 'Rezerwacja została wycofana', href: () => '/wiadomosci' },
  REVIEW_RECEIVED: { icon: 'star', tone: GOLD, title: (p) => (p?.fromName ? `Masz nową opinię od ${p.fromName}` : 'Otrzymałeś nową opinię'), sub: (p) => (p?.rating ? `Ocena: ${p.rating}/5` : ''), href: () => '/profil' },
};

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz.`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d} dni` : new Date(iso).toLocaleDateString('pl-PL');
}

export function NotificationsPage() {
  const router = useRouter();
  const { user, hydrated } = useCurrentUser();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { setLoading(false); return; }
    fetchNotifications().then(setItems).catch(() => {}).finally(() => setLoading(false));
    markAllNotifRead().catch(() => {});
  }, [user, hydrated]);

  return (
    <AccountLayout active="powiadomienia">
      <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink mb-1">Powiadomienia</h1>
      <p className="text-sm text-muted mb-6">Wszystko, co dzieje się na Twoim koncie.</p>

      {!user && hydrated ? (
        <div className="text-center py-16 text-muted text-sm">Zaloguj się, aby zobaczyć powiadomienia.<button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button></div>
      ) : loading ? (
        <div className="text-center py-16 text-muted text-sm">Wczytywanie…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">Brak powiadomień.</div>
      ) : (
        <div className="card-surface divide-y divide-line overflow-hidden">
          {items.map((n) => {
            const m = META[n.type] ?? { icon: 'bell' as IconName, tone: GOLD, title: n.type };
            const title = typeof m.title === 'function' ? m.title(n.payload) : m.title;
            const sub = m.sub ? m.sub(n.payload) : '';
            const href = m.href ? m.href(n.payload) : '';
            const unread = !n.readAt;
            return (
              <button key={n.id} onClick={() => href && router.push(href)} className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-bg/60 ${unread ? 'bg-gold-soft/20' : ''}`}>
                <span className="w-12 h-12 rounded-pill flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.tone}1A`, color: m.tone }}><Icon name={m.icon} size={21} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-semibold text-ink leading-snug">{title}</div>
                  {sub ? <div className="text-[13.5px] text-muted truncate mt-0.5">{sub}</div> : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] text-muted">{relTime(n.createdAt)}</span>
                  {unread && <span className="w-2.5 h-2.5 rounded-pill bg-gold" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
