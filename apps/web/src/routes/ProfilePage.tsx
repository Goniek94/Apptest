'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { grosze, type Listing } from '@modamarket/shared';
import { Icon, type IconName } from '../components/ui/Icon';
import { ShopCard } from '../components/product/ProductCard';
import { AccountLayout } from '../components/layout/AccountLayout';
import { logout, useCurrentUser, openAuth } from '../lib/auth';
import { fetchMyListings, fetchListings, type ApiListing } from '../lib/api/listings';
import { fetchMyOrders, fetchWallet, type ApiOrder, type WalletSummary } from '../lib/api/orders';
import { listFavorites } from '../lib/api/favorites';
import { fetchUnreadCount } from '../lib/api/messages';
import { fetchNotifications, type AppNotification } from '../lib/api/notifications';
import { getRecent, type RecentItem } from '../lib/recentlyViewed';

const ORDER_STATUS_PL: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Oczekuje', tone: 'bg-gold-soft text-gold-deep' },
  PAID: { label: 'Opłacone', tone: 'bg-success/12 text-success' },
  SHIPPED: { label: 'Wysłane', tone: 'bg-[#ECE7F6] text-[#6A52A3]' },
  DELIVERED: { label: 'Dostarczone', tone: 'bg-success/12 text-success' },
  COMPLETED: { label: 'Zakończone', tone: 'bg-success/12 text-success' },
  CANCELLED: { label: 'Anulowane', tone: 'bg-line text-muted' },
  REFUNDED: { label: 'Zwrócone', tone: 'bg-line text-muted' },
  DISPUTED: { label: 'Spór', tone: 'bg-danger/10 text-danger' },
};

function StatCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <div className="card-surface p-5 hover:border-gold/60 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={icon} size={19} /></span>
        <span className="text-[13px] text-muted">{label}</span>
      </div>
      <div className="font-serif text-[28px] leading-none font-bold text-ink">{value}</div>
    </div>
  );
}

function Panel({ title, action, children, className = '' }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-surface p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        {action && <button className="text-[13px] font-semibold text-gold flex items-center gap-1">{action} <Icon name="arrowRight" size={13} /></button>}
      </div>
      {children}
    </div>
  );
}

const QUICK: { icon: IconName; label: string; href: string }[] = [
  { icon: 'list', label: 'Moje ogłoszenia', href: '/moje-ogloszenia' },
  { icon: 'plus', label: 'Dodaj ogłoszenie', href: '/sprzedaj' },
  { icon: 'box', label: 'Transakcje', href: '/zamowienie' },
  { icon: 'heart', label: 'Ulubione', href: '/ulubione' },
  { icon: 'chat', label: 'Wiadomości', href: '/wiadomosci' },
  { icon: 'wallet', label: 'Portfel', href: '/portfel' },
  { icon: 'settings', label: 'Ustawienia konta', href: '/ustawienia' },
  { icon: 'help', label: 'Pomoc', href: '/pomoc' },
  { icon: 'dashboard', label: 'Panel administracyjny', href: '/admin' },
];

function MiniCard({ title, price, image, onClick }: { title: string; price: number; image: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="relative aspect-[4/5] rounded-xl bg-gold-soft bg-cover bg-center border border-line" style={{ backgroundImage: `url('${image}')` }}>
        <span className="absolute top-2 right-2 w-7 h-7 rounded-pill bg-white/90 flex items-center justify-center"><Icon name="heart" size={13} className="text-ink" /></span>
      </div>
      <div className="text-[12px] font-semibold text-ink truncate mt-1.5">{title}</div>
      <div className="text-[12px] font-bold text-ink">{grosze(price)}</div>
    </button>
  );
}

/** Powiadomienie → wpis w feedzie „Ostatnia aktywność". */
function notifActivity(n: AppNotification): { icon: IconName; title: string; sub: string } {
  const p = n.payload ?? {};
  switch (n.type) {
    case 'LISTING_LIKED': return { icon: 'heart', title: 'Dodano Twoje ogłoszenie do ulubionych', sub: p.title ?? '' };
    case 'LISTING_PUBLISHED': return { icon: 'check', title: 'Ogłoszenie opublikowane', sub: p.title ?? '' };
    case 'LISTING_HIDDEN': return { icon: 'eye', title: 'Ogłoszenie ukryte przez moderację', sub: p.title ?? '' };
    case 'MESSAGE': return { icon: 'chat', title: p.fromName ? `Nowa wiadomość od ${p.fromName}` : 'Nowa wiadomość', sub: '' };
    case 'OFFER_RECEIVED': return { icon: 'tag', title: 'Otrzymałeś ofertę cenową', sub: '' };
    case 'OFFER_ACCEPTED': return { icon: 'check', title: 'Twoja oferta zaakceptowana', sub: '' };
    case 'OFFER_REJECTED': return { icon: 'x', title: 'Twoja oferta odrzucona', sub: '' };
    case 'RESERVATION_REQUESTED': return { icon: 'clock', title: 'Nowa prośba o rezerwację', sub: p.title ?? '' };
    case 'RESERVATION_ACCEPTED': return { icon: 'check', title: 'Rezerwacja zaakceptowana', sub: '' };
    case 'REVIEW_RECEIVED': return { icon: 'star', title: p.fromName ? `Nowa opinia od ${p.fromName}` : 'Nowa opinia', sub: p.rating ? `Ocena: ${p.rating}/5` : '' };
    case 'ORDER_SOLD': return { icon: 'box', title: 'Sprzedano przedmiot', sub: p.title ?? '' };
    case 'PAYOUT_SUCCESS': return { icon: 'wallet', title: 'Wypłata zrealizowana', sub: '' };
    default: return { icon: 'bell', title: 'Aktywność na koncie', sub: '' };
  }
}

function relTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d} dni temu` : new Date(ts).toLocaleDateString('pl-PL');
}

export function ProfilePage() {
  const router = useRouter();
  const { user: me, hydrated } = useCurrentUser();
  const [myListings, setMyListings] = useState<ApiListing[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [favCount, setFavCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [recommended, setRecommended] = useState<Listing[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [activity, setActivity] = useState<AppNotification[]>([]);

  useEffect(() => {
    setRecent(getRecent());
    fetchListings({ limit: 10, sort: 'newest' }).then((r) => setRecommended(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchMyListings().then(setMyListings).catch(() => {});
    fetchMyOrders().then(setOrders).catch(() => {});
    fetchWallet().then(setWallet).catch(() => {});
    listFavorites().then((r) => setFavCount(r.length)).catch(() => {});
    fetchUnreadCount().then(setUnread).catch(() => {});
    fetchNotifications().then((r) => setActivity(r.slice(0, 5))).catch(() => {});
  }, [me]);

  if (hydrated && !me) {
    return (
      <AccountLayout active="przeglad">
        <div className="text-center py-20 text-muted text-sm">
          Zaloguj się, aby zobaczyć swój panel.
          <button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button>
        </div>
      </AccountLayout>
    );
  }

  const firstName = me?.displayName?.split(' ')[0] ?? '';
  const activeCount = myListings.filter((l) => l.status === 'ACTIVE').length;
  const buysCount = me ? orders.filter((o) => o.buyerId === me.id).length : 0;
  const salesCount = me ? orders.filter((o) => o.sellerId === me.id).length : 0;
  const ratingStr = me?.ratingCount ? `${(me.ratingAvg ?? 0).toFixed(1)} / 5` : '—';

  const mobileStats: { icon: IconName; label: string; value: string }[] = [
    { icon: 'bag', label: 'Zakupy', value: String(buysCount) },
    { icon: 'tag', label: 'Sprzedaże', value: String(salesCount) },
    { icon: 'list', label: 'Aktywne ogłoszenia', value: String(activeCount) },
    { icon: 'star', label: 'Opinie', value: ratingStr },
  ];

  const recentOrders = orders.slice(0, 5);
  const earningsMonth = me ? orders.reduce((s, o) => {
    if (o.sellerId !== me.id || o.status !== 'COMPLETED') return s;
    const d = new Date(o.createdAt); const now = new Date();
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return s;
    return s + (o.amount - o.commission);
  }, 0) : 0;

  return (
    <AccountLayout active="przeglad">
      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden">
        {/* karta powitalna */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gold-soft/60 p-4 mb-4">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.12] flex items-center justify-center text-gold pointer-events-none"><Icon name="hanger" size={150} /></div>
          <div className="relative flex items-center gap-4">
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="" className="w-[78px] h-[78px] rounded-pill object-cover border-2 border-white shadow-sm shrink-0" />
            ) : (
              <span className="w-[78px] h-[78px] rounded-pill bg-surface border-2 border-white shadow-sm shrink-0 flex items-center justify-center font-serif text-2xl font-bold text-gold">{(me?.displayName ?? '?').charAt(0).toUpperCase()}</span>
            )}
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-ink leading-tight">{me?.displayName ?? ''}</h1>
              {me?.accountType === 'BUSINESS' && <span className="inline-flex items-center gap-1.5 text-gold text-[14px] font-semibold mt-1"><Icon name="award" size={15} /> Firma</span>}
              <p className="text-[13px] text-ink-soft mt-1.5">Witaj ponownie w swoim panelu użytkownika.</p>
            </div>
          </div>
        </div>

        {/* staty 2×2 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {mobileStats.map((s) => (
            <div key={s.label} className="card-surface p-4">
              <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center mb-2"><Icon name={s.icon} size={17} /></span>
              <div className="text-[12px] text-muted leading-tight">{s.label}</div>
              <div className="font-serif text-2xl font-bold text-ink leading-none mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Szybki dostęp */}
        <div className="card-surface p-2 mb-3">
          <h3 className="font-serif text-lg font-semibold text-ink px-3 pt-2 pb-1">Szybki dostęp</h3>
          <div className="divide-y divide-line">
            {QUICK.map((m) => (
              <button key={m.label} onClick={() => router.push(m.href)} className="w-full flex items-center gap-3.5 px-3 py-3.5 text-left">
                <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={m.icon} size={18} /></span>
                <span className="flex-1 text-[15px] text-ink">{m.label}</span>
                <Icon name="chevronRight" size={18} className="text-muted" />
              </button>
            ))}
          </div>
        </div>

        {/* Wyloguj */}
        <button onClick={() => { logout(); router.push('/'); }} className="w-full card-surface flex items-center gap-3.5 px-4 py-3.5 text-danger font-semibold text-[15px] mb-2">
          <span className="w-10 h-10 rounded-pill bg-danger/10 flex items-center justify-center shrink-0"><Icon name="logout" size={18} /></span>
          Wyloguj się
        </button>
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block space-y-6">
        {/* powitanie — baner */}
        <div className="relative overflow-hidden rounded-2xl bg-gold-soft/50 border border-line px-7 py-7">
          <img src="/hero4.png" alt="" className="absolute right-0 top-0 bottom-0 w-1/3 object-cover opacity-30 pointer-events-none [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative">
            <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-ink">Cześć, {firstName} 👋</h1>
            <p className="text-sm text-ink-soft mt-1.5">Miło Cię widzieć! Oto podsumowanie Twojego konta.</p>
          </div>
        </div>

        {/* pasek statystyk z linkami */}
        <div className="card-surface grid grid-cols-2 lg:grid-cols-4 divide-x divide-line">
          {([
            { icon: 'tag', value: String(activeCount), label: 'Aktywne ogłoszenia', link: 'Zobacz wszystkie', href: '/moje-ogloszenia' },
            { icon: 'wallet', value: grosze(earningsMonth), label: 'Zarobki w tym miesiącu', link: 'Szczegóły', href: '/portfel' },
            { icon: 'heart', value: String(favCount), label: 'Ulubionych', link: 'Zobacz ulubione', href: '/ulubione' },
            { icon: 'chat', value: String(unread), label: 'Nowe wiadomości', link: 'Zobacz wiadomości', href: '/wiadomosci' },
          ] as { icon: IconName; value: string; label: string; link: string; href: string }[]).map((s) => (
            <div key={s.label} className="px-6 py-5">
              <div className="flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={s.icon} size={19} /></span>
                <div>
                  <div className="font-serif text-2xl font-bold text-ink leading-none">{s.value}</div>
                  <div className="text-[12px] text-muted mt-1">{s.label}</div>
                </div>
              </div>
              <button onClick={() => router.push(s.href)} className="text-[12px] font-semibold text-gold flex items-center gap-1 mt-3">{s.link} <Icon name="arrowRight" size={12} /></button>
            </div>
          ))}
        </div>

        {/* Twoje ogłoszenia + Ostatnio oglądane */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-6">
          <div className="card-surface p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif text-lg font-semibold text-ink">Twoje ogłoszenia</h3>
                <span className="text-[11px] font-semibold text-success bg-success/12 px-2 py-0.5 rounded-pill">{activeCount} aktywne</span>
              </div>
              <button onClick={() => router.push('/moje-ogloszenia')} className="text-[13px] font-semibold text-gold flex items-center gap-1">Zobacz wszystkie <Icon name="arrowRight" size={13} /></button>
            </div>
            <div className="divide-y divide-line flex-1">
              {myListings.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-muted">Nie masz jeszcze ogłoszeń.</div>
              ) : myListings.slice(0, 3).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-3.5">
                  <div onClick={() => router.push(`/produkt/${l.id}`)} className="w-12 h-14 rounded-lg bg-gold-soft bg-cover bg-center shrink-0 cursor-pointer" style={{ backgroundImage: `url('${l.images?.[0]?.url ?? ''}')` }} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/produkt/${l.id}`)}>
                    <div className="text-[14px] font-semibold text-ink leading-snug truncate">{l.title}</div>
                    <div className="text-[14px] font-bold text-ink mt-0.5">{grosze(l.price)}</div>
                    <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1"><Icon name="eye" size={12} /> {l.views}</span>
                      <span>· Opublikowane {relTime(new Date(l.createdAt).getTime())}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-pill shrink-0 ${l.status === 'ACTIVE' ? 'bg-success/12 text-success' : 'bg-line text-muted'}`}>{l.status === 'ACTIVE' ? 'Aktywne' : l.status}</span>
                  <button onClick={() => router.push('/moje-ogloszenia')} className="px-3.5 py-1.5 rounded-pill border border-line text-[12px] font-semibold text-ink hover:border-gold transition-colors shrink-0">Edytuj</button>
                </div>
              ))}
            </div>
            {myListings.length > 0 && <button onClick={() => router.push('/moje-ogloszenia')} className="text-[13px] font-semibold text-gold flex items-center gap-1 mx-auto mt-4">Zobacz wszystkie ogłoszenia <Icon name="arrowRight" size={13} /></button>}
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-ink">Ostatnio oglądane</h3>
              <button onClick={() => router.push('/szukaj')} className="text-[13px] font-semibold text-gold flex items-center gap-1">Zobacz wszystkie <Icon name="arrowRight" size={13} /></button>
            </div>
            {recent.length === 0 ? (
              <div className="py-14 text-center text-[13px] text-muted">Nic tu jeszcze nie ma — przeglądaj ogłoszenia, a pojawią się tutaj.</div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                {recent.slice(0, 5).map((r) => <MiniCard key={r.id} title={r.title} price={r.price} image={r.image} onClick={() => router.push(`/produkt/${r.id}`)} />)}
              </div>
            )}
          </div>
        </div>

        {/* Dla Ciebie + Ostatnia aktywność / wskazówka */}
        <div className="grid lg:grid-cols-[3fr_1fr] gap-6">
          <div className="card-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink flex items-center gap-1.5">Dla Ciebie <span className="text-gold">✨</span></h2>
              <button onClick={() => router.push('/szukaj')} className="text-[13px] font-semibold text-gold flex items-center gap-1">Zobacz więcej <Icon name="arrowRight" size={13} /></button>
            </div>
            <p className="text-[12px] text-muted mt-0.5 mb-4">Wybrane na podstawie Twojej aktywności</p>
            <div className="flex gap-2 mb-4">
              {['Nowości', 'Streetwear', 'Premium', 'Akcesoria'].map((c, i) => (
                <span key={c} className={`px-3.5 py-1.5 rounded-pill text-[12px] font-semibold border ${i === 0 ? 'bg-gold-soft border-gold text-gold' : 'border-line text-ink-soft'}`}>{c}</span>
              ))}
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
              {recommended.slice(0, 7).map((p) => <MiniCard key={p.id} title={p.title} price={p.price} image={p.imageUrl} onClick={() => router.push(`/produkt/${p.id}`)} />)}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface p-5">
              <h3 className="font-serif text-base font-semibold text-ink mb-4">Ostatnia aktywność</h3>
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <div className="text-[12px] text-muted text-center py-4">Brak aktywności.</div>
                ) : activity.map((n) => {
                  const a = notifActivity(n);
                  return (
                    <div key={n.id} className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={a.icon} size={14} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink leading-snug">{a.title}</div>
                        {a.sub ? <div className="text-[11px] text-muted truncate">{a.sub}</div> : null}
                      </div>
                      <span className="text-[10px] text-muted shrink-0 whitespace-nowrap">{relTime(new Date(n.createdAt).getTime())}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-5">
              <div className="flex items-center gap-1.5 text-gold font-semibold text-[13px] mb-1.5"><span>✨</span> Szybka wskazówka</div>
              <p className="text-[12px] text-ink-soft leading-relaxed">Dodaj więcej zdjęć do ogłoszenia — zwiększysz szansę na sprzedaż nawet o 40%.</p>
              <button onClick={() => router.push('/sprzedaj')} className="btn-gold w-full py-2.5 text-white text-[13px] mt-3">Dodaj zdjęcia</button>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
