'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IMG, grosze } from '@modamarket/shared';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Avatar } from '../../components/ui';
import {
  fetchAdminUsers, banUser, verifyUser,
  fetchAdminListings, verifyListing, setListingStatus, removeAdminListing,
  type AdminUser, type AdminListing, type AdminListingStatus,
} from '../../lib/api/admin';

/* ---------- wspólne ---------- */
const TONE: Record<string, string> = {
  green: 'bg-success/12 text-success',
  amber: 'bg-gold-soft text-gold-deep',
  red: 'bg-danger/10 text-danger',
  blue: 'bg-[#E6EEF6] text-[#3B6CA8]',
  gray: 'bg-line text-muted',
};

function Shell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="w-full max-w-[920px] mx-auto px-4 py-5 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gold"><Icon name="arrowLeft" size={22} /></button>
        <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink">{title}</h1>
      </div>
      {sub && <p className="text-sm text-muted mt-1 mb-5">{sub}</p>}
      <div className={sub ? '' : 'mt-5'}>{children}</div>
    </div>
  );
}

function Badge({ label, tone, dot }: { label: string; tone: keyof typeof TONE; dot?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-pill whitespace-nowrap ${TONE[tone]}`}>{dot && <span className="w-1.5 h-1.5 rounded-pill bg-current" />}{label}</span>;
}

function MiniStat({ icon, label, value, delta, center }: { icon: IconName; label: string; value: string; delta: string; center?: boolean }) {
  return (
    <div className={`card-surface p-3.5 ${center ? 'text-center' : ''}`}>
      <span className={`w-9 h-9 rounded-pill bg-gold-soft text-gold flex items-center justify-center ${center ? 'mx-auto' : ''} mb-2`}><Icon name={icon} size={17} /></span>
      <div className="text-[12px] text-muted leading-tight">{label}</div>
      <div className="font-serif text-xl font-bold text-ink leading-none mt-1">{value}</div>
      <div className="text-[11px] text-gold-deep font-semibold mt-1">{delta}</div>
    </div>
  );
}

function PillTabs<T extends string>({ tabs, active, onChange }: { tabs: { label: T; count?: number }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
      {tabs.map((t) => (
        <button key={t.label} onClick={() => onChange(t.label)} className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-pill text-[13px] font-semibold border transition-colors ${active === t.label ? 'bg-gold-soft border-gold text-gold-deep' : 'bg-surface border-line text-ink-soft'}`}>
          {t.label}{t.count != null && <span className={`text-[11px] px-1.5 py-0.5 rounded-pill ${active === t.label ? 'bg-gold/20' : 'bg-line'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ placeholder, filter = true }: { placeholder: string; filter?: boolean }) {
  return (
    <div className="flex gap-2.5 mb-4">
      <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-xl px-4 py-2.5"><Icon name="search" size={17} className="text-muted" /><input placeholder={placeholder} className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" /></div>
      {filter && <button className="flex items-center gap-2 bg-surface border border-line rounded-xl px-4 text-gold font-semibold text-sm"><Icon name="sliders" size={16} /> Filtry</button>}
    </div>
  );
}

/* ===================== UŻYTKOWNICY ===================== */
function userBadge(u: AdminUser): { label: string; tone: keyof typeof TONE } {
  if (u.bannedAt) return { label: 'Zablokowany', tone: 'red' };
  if (u.verified) return { label: 'Zweryfikowany', tone: 'green' };
  return { label: 'Nowy', tone: 'blue' };
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const load = (query?: string) => { fetchAdminUsers(query || undefined).then(setUsers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggleBan = async (u: AdminUser) => { setUsers((us) => us.map((x) => x.id === u.id ? { ...x, bannedAt: u.bannedAt ? null : new Date().toISOString() } : x)); try { await banUser(u.id, !u.bannedAt); } catch { load(q); } };
  const toggleVerify = async (u: AdminUser) => { setUsers((us) => us.map((x) => x.id === u.id ? { ...x, verified: !u.verified } : x)); try { await verifyUser(u.id, !u.verified); } catch { load(q); } };

  return (
    <Shell title="Użytkownicy" sub="Moderacja kont — weryfikacja i blokady.">
      <div className="flex gap-2.5 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-xl px-4 py-2.5">
          <Icon name="search" size={17} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(q)} placeholder="Szukaj po nazwie lub e-mailu…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" />
        </div>
        <button onClick={() => load(q)} className="bg-surface border border-line rounded-xl px-4 text-gold font-semibold text-sm">Szukaj</button>
      </div>
      <div className="card-surface divide-y divide-line overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-[13px] text-muted">Wczytywanie…</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted">Brak użytkowników.</div>
        ) : users.map((u) => {
          const b = userBadge(u);
          return (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
              <Avatar name={u.displayName} src={u.avatarUrl ?? undefined} size={48} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-ink truncate flex items-center gap-2">{u.displayName}{u.role === 'ADMIN' && <span className="text-[10px] font-bold text-gold bg-gold-soft px-1.5 py-0.5 rounded-pill">ADMIN</span>}</div>
                <div className="text-[12px] text-muted truncate">{u.email}</div>
                <div className="text-[12px] text-muted">{u._count.listings} ogłoszeń · {u.accountType === 'BUSINESS' ? 'Firma' : 'Osoba'}</div>
              </div>
              <Badge label={b.label} tone={b.tone} dot={b.tone !== 'amber'} />
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => toggleVerify(u)} className="text-[12px] font-semibold px-2.5 py-1 rounded-pill border border-line hover:border-gold text-ink-soft">{u.verified ? 'Cofnij weryf.' : 'Zweryfikuj'}</button>
                <button onClick={() => toggleBan(u)} className={`text-[12px] font-semibold px-2.5 py-1 rounded-pill border ${u.bannedAt ? 'border-success text-success' : 'border-danger/40 text-danger'}`}>{u.bannedAt ? 'Odblokuj' : 'Zablokuj'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ===================== OGŁOSZENIA (moderacja) ===================== */
const LISTING_TABS: { label: string; status?: AdminListingStatus }[] = [
  { label: 'Wszystkie' }, { label: 'Aktywne', status: 'ACTIVE' }, { label: 'Zarezerwowane', status: 'RESERVED' }, { label: 'Archiwum', status: 'ARCHIVED' },
];

export function AdminListings() {
  const [tab, setTab] = useState('Wszystkie');
  const [items, setItems] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const load = (label = tab) => {
    const status = LISTING_TABS.find((t) => t.label === label)?.status;
    setLoading(true);
    fetchAdminListings(status).then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load('Wszystkie'); }, []);
  const onTab = (t: string) => { setTab(t); load(t); };

  const toggleVerify = async (it: AdminListing) => { setItems((xs) => xs.map((x) => x.id === it.id ? { ...x, verified: !it.verified } : x)); try { await verifyListing(it.id, !it.verified); } catch { load(); } };
  const archive = async (it: AdminListing) => { try { await setListingStatus(it.id, 'ARCHIVED'); load(); } catch {} };
  const remove = async (it: AdminListing) => { if (!confirm('Usunąć ogłoszenie?')) return; setItems((xs) => xs.filter((x) => x.id !== it.id)); try { await removeAdminListing(it.id); } catch { load(); } };

  return (
    <Shell title="Ogłoszenia" sub="Moderacja ofert — weryfikacja, archiwizacja, usuwanie.">
      <PillTabs tabs={LISTING_TABS.map((t) => ({ label: t.label }))} active={tab} onChange={onTab} />
      <div className="space-y-3">
        {loading ? (
          <div className="card-surface py-10 text-center text-[13px] text-muted">Wczytywanie…</div>
        ) : items.length === 0 ? (
          <div className="card-surface py-10 text-center text-[13px] text-muted">Brak ogłoszeń.</div>
        ) : items.map((it) => (
          <div key={it.id} className="card-surface p-3 flex gap-3 items-center">
            <div className="w-[84px] h-[84px] rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${it.images?.[0]?.url ?? ''}')` }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-ink truncate">{it.title}</div>
                  <div className="text-[12px] text-muted flex items-center gap-1"><Icon name="user" size={12} /> {it.seller.displayName}</div>
                  <div className="font-serif text-[17px] font-bold text-ink mt-0.5">{grosze(it.price)}</div>
                </div>
                <Badge label={it.verified ? 'Zweryfikowane' : 'Do weryfikacji'} tone={it.verified ? 'green' : 'amber'} dot />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => toggleVerify(it)} className="text-[12px] font-semibold px-2.5 py-1 rounded-pill border border-line hover:border-gold text-ink-soft">{it.verified ? 'Cofnij' : 'Zweryfikuj'}</button>
                {it.status !== 'ARCHIVED' && <button onClick={() => archive(it)} className="text-[12px] font-semibold px-2.5 py-1 rounded-pill border border-line text-ink-soft">Archiwizuj</button>}
                <button onClick={() => remove(it)} className="text-[12px] font-semibold px-2.5 py-1 rounded-pill border border-danger/40 text-danger">Usuń</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ===================== TRANSAKCJE ===================== */
export function AdminTransactions() {
  const [tab, setTab] = useState('Wszystkie');
  const tx = [
    { img: IMG.trench, id: '#12890', title: 'Płaszcz wełniany klasyczny', date: '23 maj 2024, 10:32', amount: '1 249,00 zł', label: 'Opłacone', tone: 'green' as const },
    { img: IMG.bag, id: '#12889', title: 'Torebka skórzana Bella', date: '23 maj 2024, 09:15', amount: '849,00 zł', label: 'Wysłane', tone: 'blue' as const },
    { img: IMG.sneaker, id: '#12888', title: 'Sneakersy białe', date: '22 maj 2024, 18:47', amount: '379,00 zł', label: 'W realizacji', tone: 'amber' as const },
    { img: IMG.hoodie, id: '#12887', title: 'Sweter oversize z wełny', date: '22 maj 2024, 16:21', amount: '289,00 zł', label: 'Opłacone', tone: 'green' as const },
    { img: IMG.sunglasses, id: '#12885', title: 'Okulary przeciwsłoneczne', date: '22 maj 2024, 12:33', amount: '249,00 zł', label: 'Opłacone', tone: 'green' as const },
  ];
  return (
    <Shell title="Transakcje" sub="Przeglądaj i zarządzaj wszystkimi transakcjami.">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniStat icon="clock" label="Dziś" value="18" delta="12 430 zł" />
        <MiniStat icon="refresh" label="W toku" value="36" delta="28 750 zł" />
        <MiniStat icon="check" label="Zakończone" value="128" delta="92 140 zł" />
        <MiniStat icon="refresh" label="Zwroty" value="9" delta="4 320 zł" />
      </div>
      <PillTabs tabs={[{ label: 'Wszystkie' }, { label: 'Opłacone' }, { label: 'W realizacji' }, { label: 'Anulowane' }]} active={tab} onChange={setTab} />
      <SearchBar placeholder="Szukaj transakcji…" />
      <div className="card-surface divide-y divide-line overflow-hidden">
        {tx.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-3">
            <div className="w-12 h-12 rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${t.img}')` }} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink">{t.id}</div>
              <div className="text-[12px] text-ink-soft truncate">{t.title}</div>
              <div className="text-[11px] text-muted">{t.date}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[14px] font-bold text-ink">{t.amount}</div>
              <div className="mt-1"><Badge label={t.label} tone={t.tone} dot /></div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ===================== ZWROTY I REKLAMACJE ===================== */
export function AdminReturns() {
  const [tab, setTab] = useState('Zwroty');
  const items = [
    { img: IMG.hoodie, order: '#1287', name: 'Anna Kowalska', product: 'Sweter oversize z wełny merino', reason: 'Nie pasuje rozmiar', term: '24.05.2024 (za 3 dni)', label: 'Nowe', tone: 'amber' as const },
    { img: IMG.trench, order: '#1249', name: 'Marta Nowak', product: 'Trencz klasyczny beżowy', reason: 'Produkt uszkodzony', term: '20.05.2024 (dziś)', label: 'W trakcie', tone: 'amber' as const },
    { img: IMG.sneaker, order: '#1211', name: 'Katarzyna Wiśniewska', product: 'Sneakersy skórzane białe', reason: 'Niezgodność z opisem', term: '19.05.2024 (wczoraj)', label: 'W trakcie', tone: 'amber' as const },
    { img: IMG.bag, order: '#1188', name: 'Aleksandra Zielińska', product: 'Torebka skórzana czarna', reason: 'Produkt uszkodzony', term: '15.05.2024', label: 'Zamknięte', tone: 'green' as const },
    { img: IMG.dressW, order: '#1136', name: 'Monika Wójcik', product: 'Sukienka lniana beżowa', reason: 'Nie pasuje rozmiar', term: '12.05.2024', label: 'Zamknięte', tone: 'green' as const },
  ];
  return (
    <Shell title="Zwroty i reklamacje" sub="Zarządzanie zwrotami i reklamacjami.">
      <PillTabs tabs={[{ label: 'Zwroty', count: 23 }, { label: 'Reklamacje', count: 15 }, { label: 'W toku', count: 8 }]} active={tab} onChange={setTab} />
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.order} className="card-surface p-3 flex gap-3">
            <div className="w-[88px] h-[110px] rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${it.img}')` }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] text-muted">Zamówienie {it.order}</span>
                <Badge label={it.label} tone={it.tone} />
              </div>
              <div className="font-semibold text-ink mt-0.5">{it.name}</div>
              <div className="text-[13px] text-ink-soft">{it.product}</div>
              <div className="text-[12px] text-muted flex items-center gap-1.5 mt-1.5"><Icon name="refresh" size={13} className="text-gold" /> {it.reason}</div>
              <div className="text-[12px] text-muted flex items-center gap-1.5 mt-0.5"><Icon name="clock" size={13} /> Termin zgłoszenia: <span className="text-gold-deep font-medium">{it.term}</span></div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ===================== WIADOMOŚCI SYSTEMOWE ===================== */
export function AdminMessages() {
  const [tab, setTab] = useState('Wszystkie');
  const msgs = [
    { icon: 'bag' as IconName, title: 'Nowe metody dostawy', aud: 'Wszyscy', audIcon: 'users' as IconName, label: 'Wysłane', tone: 'green' as const, when: 'Wysłane: 12.05.2024, 10:30' },
    { icon: 'tag' as IconName, title: 'Promocja -10% na wszystko', aud: 'Kupujący', audIcon: 'user' as IconName, label: 'Wysłane', tone: 'green' as const, when: 'Wysłane: 08.05.2024, 09:15' },
    { icon: 'shield' as IconName, title: 'Weryfikacja konta sprzedającego', aud: 'Sprzedający', audIcon: 'user' as IconName, label: 'Zaplanowane', tone: 'amber' as const, when: 'Zaplanowane: 20.05.2024, 12:00' },
    { icon: 'flag' as IconName, title: 'Aktualizacja regulaminu', aud: 'Wszyscy', audIcon: 'users' as IconName, label: 'Szkic', tone: 'gray' as const, when: 'Szkic zapisany: 15.05.2024, 14:45' },
    { icon: 'gift' as IconName, title: 'Dzień Darmowej Dostawy', aud: 'Kupujący', audIcon: 'user' as IconName, label: 'Wysłane', tone: 'green' as const, when: 'Wysłane: 01.05.2024, 08:00' },
  ];
  const templates = [
    { icon: 'gift' as IconName, title: 'Powitanie', aud: 'Wszyscy' },
    { icon: 'shield' as IconName, title: 'Weryfikacja konta', aud: 'Sprzedający' },
    { icon: 'tag' as IconName, title: 'Promocja', aud: 'Kupujący' },
    { icon: 'bell' as IconName, title: 'Przypomnienie', aud: 'Wszyscy' },
  ];
  return (
    <Shell title="Wiadomości systemowe" sub="Zarządzaj komunikacją z użytkownikami platformy.">
      <button className="btn-gold w-full py-3.5 text-white font-semibold mb-5"><Icon name="edit" size={17} /> Nowa wiadomość</button>
      <PillTabs tabs={[{ label: 'Wszystkie' }, { label: 'Wysłane' }, { label: 'Zaplanowane' }, { label: 'Szkice' }]} active={tab} onChange={setTab} />
      <div className="space-y-3">
        {msgs.map((m) => (
          <div key={m.title} className="card-surface p-4 flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={m.icon} size={19} /></span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-ink">{m.title}</div>
              <span className="inline-flex items-center gap-1.5 bg-gold-soft/60 text-gold-deep text-[12px] font-medium px-2.5 py-0.5 rounded-pill mt-1"><Icon name={m.audIcon} size={12} /> {m.aud}</span>
              <div className="text-[12px] text-muted flex items-center gap-1 mt-1"><Icon name="clock" size={12} /> {m.when}</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0"><Badge label={m.label} tone={m.tone} /><Icon name="dots" size={16} className="text-muted" /></div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6 mb-3"><h2 className="font-serif text-lg font-semibold text-ink">Szablony wiadomości</h2><button className="text-[13px] font-semibold text-gold flex items-center gap-1">Zobacz wszystkie <Icon name="chevronRight" size={13} /></button></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {templates.map((t) => (
          <button key={t.title} className="card-surface p-4 text-center">
            <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center mx-auto mb-2"><Icon name={t.icon} size={18} /></span>
            <div className="text-[13px] font-semibold text-ink">{t.title}</div>
            <div className="text-[11px] text-muted">{t.aud}</div>
          </button>
        ))}
      </div>
    </Shell>
  );
}

/* ===================== STATYSTYKI ===================== */
export function AdminStats() {
  const data = [2, 3, 6, 4.8, 6.4, 4.8, 6.5];
  const days = ['17 maj', '18 maj', '19 maj', '20 maj', '21 maj', '22 maj', '23 maj'];
  const W = 320, H = 150, pad = 12, max = 8;
  const pts = data.map((v, i) => [pad + (i * (W - 2 * pad)) / (data.length - 1), H - pad - (v / max) * (H - 2 * pad)] as const);
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `M ${pts[0][0]},${H - pad} ${pts.map((p) => `L ${p[0]},${p[1]}`).join(' ')} L ${pts[pts.length - 1][0]},${H - pad} Z`;
  const cats = [
    { icon: 'hanger' as IconName, name: 'Odzież damska', amount: '5 420 zł', pct: 43 },
    { icon: 'tag' as IconName, name: 'Odzież męska', amount: '3 120 zł', pct: 25 },
    { icon: 'sliders' as IconName, name: 'Obuwie', amount: '2 030 zł', pct: 16 },
    { icon: 'bag' as IconName, name: 'Akcesoria', amount: '1 860 zł', pct: 15 },
  ];
  return (
    <Shell title="Statystyki" sub="Przegląd kluczowych danych platformy.">
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MiniStat icon="bag" label="Sprzedaż" value="12 430 zł" delta="+8% od wczoraj" />
        <MiniStat icon="user" label="Nowi użytkownicy" value="58" delta="+12 od wczoraj" />
        <MiniStat icon="tag" label="Aktywne ogłoszenia" value="1 248" delta="+32 od wczoraj" />
        <MiniStat icon="chart" label="Konwersja" value="3,24%" delta="+0,35 p.p. od wczoraj" />
      </div>
      <div className="card-surface p-5 mb-4">
        <div className="flex items-center justify-between mb-3"><h2 className="font-serif text-lg font-semibold text-ink">Sprzedaż w czasie</h2><span className="text-[13px] text-muted flex items-center gap-1">Ostatnie 7 dni <Icon name="chevronDown" size={14} /></span></div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
          {[0, 2, 4, 6, 8].map((g) => { const y = H - pad - (g / max) * (H - 2 * pad); return <line key={g} x1={pad} y1={y} x2={W - pad} y2={y} stroke="#ECE6DB" strokeWidth="1" strokeDasharray="3 3" />; })}
          <path d={area} fill="#C0913C" fillOpacity="0.1" />
          <polyline points={line} fill="none" stroke="#C0913C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#FFF" stroke="#C0913C" strokeWidth="2" />)}
        </svg>
        <div className="flex justify-between text-[10px] text-muted px-1 mt-1">{days.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="flex items-end justify-between border-t border-line mt-4 pt-4">
          <div><div className="text-[12px] text-muted">Łączna sprzedaż</div><div className="font-serif text-2xl font-bold text-ink">12 430 zł</div></div>
          <div className="text-right"><div className="text-[12px] text-muted">Zmiana</div><div className="font-serif text-xl font-bold text-gold">+8%</div></div>
        </div>
      </div>
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-serif text-lg font-semibold text-ink">Najlepsze kategorie</h2><span className="text-[13px] text-muted flex items-center gap-1">Ostatnie 7 dni <Icon name="chevronDown" size={14} /></span></div>
        <div className="space-y-4">
          {cats.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={c.icon} size={17} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[14px]"><span className="font-medium text-ink">{c.name}</span><span className="text-ink font-semibold">{c.amount} <span className="text-muted font-normal">{c.pct}%</span></span></div>
                <div className="h-1.5 rounded-pill bg-line mt-1.5 overflow-hidden"><div className="h-full bg-gold rounded-pill" style={{ width: `${c.pct}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ===================== USTAWIENIA PLATFORMY ===================== */
export function AdminSettings() {
  const items: { icon: IconName; title: string; sub: string }[] = [
    { icon: 'wallet', title: 'Płatności', sub: 'Zarządzaj metodami płatności i rozliczeniami.' },
    { icon: 'tag', title: 'Prowizje', sub: 'Ustaw prowizje i zasady naliczania opłat.' },
    { icon: 'grid', title: 'Kategorie', sub: 'Zarządzaj kategoriami i podkategoriami ofert.' },
    { icon: 'truck', title: 'Wysyłka', sub: 'Konfiguruj metody wysyłki i dostawy.' },
    { icon: 'bell', title: 'Powiadomienia', sub: 'Ustaw preferencje powiadomień systemowych.' },
    { icon: 'refresh', title: 'Polityka zwrotów', sub: 'Zdefiniuj zasady zwrotów i reklamacji.' },
    { icon: 'shield', title: 'Moderacja', sub: 'Zarządzaj zasadami moderacji i weryfikacji.' },
    { icon: 'settings', title: 'Integracje', sub: 'Połącz platformę z zewnętrznymi usługami.' },
  ];
  return (
    <Shell title="Ustawienia platformy" sub="Konfiguruj kluczowe ustawienia i zasady platformy.">
      <div className="card-surface divide-y divide-line overflow-hidden">
        {items.map((it) => (
          <button key={it.title} className="w-full flex items-center gap-3.5 px-4 py-4 text-left">
            <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={it.icon} size={18} /></span>
            <div className="flex-1 min-w-0"><div className="text-[16px] font-semibold text-ink">{it.title}</div><div className="text-[12px] text-muted">{it.sub}</div></div>
            <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
          </button>
        ))}
      </div>
    </Shell>
  );
}
