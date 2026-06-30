'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { grosze, conditionLabel, type Listing } from '@modamarket/shared';
import { fetchListing, fetchListings, toListing, type ApiListing } from '../lib/api/listings';
import { startConversation } from '../lib/api/messages';
import { createReservation, RESERVATION_PERIODS } from '../lib/api/reservations';
import { useCurrentUser, openAuth } from '../lib/auth';
import { pushRecent } from '../lib/recentlyViewed';
import { Icon, type IconName } from '../components/ui/Icon';
import { Avatar, Button } from '../components/ui';
import { ShopCard } from '../components/product/ProductCard';

const TRUST: { icon: IconName; label: string }[] = [
  { icon: 'shield', label: 'Ochrona kupującego' },
  { icon: 'truck', label: 'Śledzona przesyłka' },
  { icon: 'box', label: 'Zwroty 14 dni' },
];

export function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [raw, setRaw] = useState<ApiListing | null>(null);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [resOpen, setResOpen] = useState(false);
  const [resHours, setResHours] = useState(48);
  const [resNote, setResNote] = useState('');
  const [resBusy, setResBusy] = useState(false);
  const [resMsg, setResMsg] = useState('');

  useEffect(() => {
    if (!params.id) return;
    fetchListing(params.id).then((r) => {
      setRaw(r.raw);
      pushRecent({ id: r.raw.id, title: r.raw.title, price: r.raw.price, image: r.raw.images?.[0]?.url ?? '' });
    }).catch(() => {});
  }, [params.id]);

  // Podobne ogłoszenia — z tej samej kategorii (web).
  useEffect(() => {
    const slug = raw?.category?.slug;
    if (!slug || !raw) { setSimilar([]); return; }
    fetchListings({ categorySlug: slug, limit: 12 })
      .then((r) => setSimilar(r.items.filter((l) => l.id !== raw.id).slice(0, 5)))
      .catch(() => {});
  }, [raw?.id, raw?.category?.slug]);

  const contactSeller = async () => {
    if (!user) { openAuth('login'); return; }
    if (!raw) return;
    try {
      const { id } = await startConversation(raw.id);
      router.push(`/wiadomosci?c=${id}`);
    } catch {
      router.push('/wiadomosci');
    }
  };

  if (!raw) {
    return <div className="py-32 text-center text-muted text-sm">Wczytywanie ogłoszenia…</div>;
  }

  const p = toListing(raw);
  const seller = raw.seller;
  const isBusiness = seller?.accountType === 'BUSINESS';
  const gallery = raw.images.length ? raw.images.map((i) => i.url) : [p.imageUrl];

  const details: { icon: IconName; label: string; value: string }[] = [
    { icon: 'shield', label: 'Stan', value: conditionLabel(p.condition) },
    { icon: 'hanger', label: 'Rozmiar', value: p.size ?? 'Uniwersalny' },
    { icon: 'tag', label: 'Kolor', value: p.color ?? '—' },
    { icon: 'bag', label: 'Kategoria', value: raw.category?.name ?? '—' },
    { icon: 'crown', label: 'Marka', value: p.brand ?? '—' },
    { icon: 'refresh', label: 'Materiał', value: raw.material ?? '—' },
  ];

  const description = raw.description?.trim() ||
    `Klasyczny produkt ${p.brand ?? ''} w ponadczasowej, ${p.color?.toLowerCase() ?? 'uniwersalnej'} kolorystyce. Wysokiej jakości materiały zapewniają trwałość i komfort. Oryginalny, sprawdzony przez moderację AdBox.`;
  const paragraphs = description.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const longDesc = description.length > 360;
  const canReserve = raw.status === 'ACTIVE' && user?.id !== raw.sellerId;

  async function submitReservation() {
    if (!user) { openAuth('login'); return; }
    setResBusy(true);
    setResMsg('');
    try {
      await createReservation({ listingId: raw!.id, hours: resHours, message: resNote.trim() || undefined });
      setResMsg('Wysłano prośbę o rezerwację — czekaj na akceptację sprzedawcy.');
      setTimeout(() => setResOpen(false), 1600);
    } catch (e: any) {
      setResMsg(e?.message ?? 'Nie udało się zarezerwować.');
    } finally {
      setResBusy(false);
    }
  }

  return (
    <div>
      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden">
        {/* zdjęcie główne */}
        <div className="relative aspect-[4/3] bg-gold-soft bg-cover bg-center" style={{ backgroundImage: `url('${gallery[active]}')` }}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-pill bg-white/92 flex items-center justify-center shadow-sm"><Icon name="heart" size={18} className="text-ink" /></button>
        </div>

        {/* miniatury */}
        <div className="flex gap-2.5 px-4 py-3 overflow-x-auto no-scrollbar">
          {gallery.map((src, i) => (
            <button key={i} onClick={() => setActive(i)} className={`w-[68px] h-[68px] rounded-xl bg-gold-soft bg-cover bg-center shrink-0 ${i === active ? 'ring-2 ring-gold' : 'border border-line'}`} style={{ backgroundImage: `url('${src}')` }} />
          ))}
        </div>

        <div className="px-4 pb-6">
          {/* nagłówek */}
          <div className="text-center">
            <div className="text-[12px] tracking-[0.18em] uppercase text-gold font-bold">{p.brand}</div>
            <h1 className="font-serif text-[26px] font-semibold text-ink mt-1">{p.title}</h1>
            <div className="text-[13px] text-muted mt-1">{conditionLabel(p.condition)} · {p.size ? `Rozmiar ${p.size}` : 'Uniwersalny'}{p.color ? ` · ${p.color}` : ''}</div>
            <div className="font-serif text-[28px] font-bold text-ink mt-3">{grosze(p.price)}</div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 mt-5">
            <button onClick={() => router.push('/platnosc')} className="flex-1 btn-dark py-3.5 text-white font-semibold rounded-pill">Kup teraz</button>
            {raw.groupBuy && (
              <button onClick={() => router.push('/kup-w-zespole')} className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-pill border border-gold text-ink font-semibold"><Icon name="users" size={17} className="text-gold" /> Kup w grupie</button>
            )}
          </div>
          {raw.quantity > 1 && <p className="text-[13px] text-muted text-center mt-2">Dostępne: {raw.quantity} szt.</p>}

          {/* Detale */}
          <div className="card-surface p-4 mt-6">
            <h3 className="font-serif text-lg font-semibold text-ink mb-3">Detale</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-2.5 border border-line rounded-xl px-3 py-2.5">
                  <Icon name={d.icon} size={17} className="text-gold shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted leading-tight">{d.label}</div>
                    <div className="text-[13px] font-semibold text-ink truncate">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opis */}
          <div className="mt-6">
            <h3 className="font-serif text-lg font-semibold text-ink mb-2">Opis</h3>
            <p className={`text-sm leading-relaxed text-ink-soft whitespace-pre-line ${expanded ? '' : 'line-clamp-2'}`}>
              {description}
            </p>
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[13px] font-semibold text-gold mt-1.5">
              {expanded ? 'Pokaż mniej' : 'Pokaż więcej'} <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} className={expanded ? 'rotate-180' : ''} />
            </button>
          </div>

          {/* Sprzedawca */}
          <div className="card-surface p-3.5 mt-6 flex items-center gap-3">
            <Avatar name={seller?.displayName ?? 'Sprzedawca'} src={seller?.avatarUrl ?? undefined} size={48} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                {seller?.displayName ?? 'Sprzedawca'}
                {isBusiness && <span className="text-[10px] font-semibold text-gold bg-gold-soft px-2 py-0.5 rounded-pill">Firma</span>}
              </div>
              <div className="text-[12px] text-muted flex items-center gap-1"><Icon name="star" size={12} className="text-gold" fill="currentColor" /> {(seller?.ratingAvg ?? 0).toFixed(1)} · {seller?.ratingCount ?? 0} opinii</div>
              {seller?.verified && <div className="text-[12px] text-gold font-medium flex items-center gap-1 mt-0.5"><Icon name="shield" size={12} /> Zweryfikowany sprzedawca</div>}
            </div>
            <button onClick={contactSeller} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pill border border-line text-[13px] font-semibold text-ink"><Icon name="chat" size={15} /> Napisz</button>
          </div>

          {/* Zaufanie */}
          <div className="flex border-t border-line mt-6 pt-4">
            {TRUST.map((t) => (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-1 text-center">
                <span className="text-gold"><Icon name={t.icon} size={18} /></span>
                <span className="text-[11px] text-muted leading-tight px-1">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block w-full max-w-[1360px] mx-auto px-6 lg:px-10 py-8">
        {/* breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[12px] text-muted mb-5 flex-wrap">
          <button onClick={() => router.push('/')} className="hover:text-gold">Strona główna</button>
          {raw.category?.name && <><Icon name="chevronRight" size={12} /><button onClick={() => router.push(`/szukaj?categorySlug=${raw.category!.slug}`)} className="hover:text-gold">{raw.category.name}</button></>}
          {p.brand && <><Icon name="chevronRight" size={12} /><span className="text-ink-soft">{p.brand}</span></>}
        </div>

        <div className="grid grid-cols-[1fr_540px] gap-12 items-start">
          {/* LEWA: tytuł + zdjęcia + opis */}
          <div>
            <div className="mb-5">
              <div className="text-[12px] tracking-widest uppercase text-gold font-bold">{p.brand}</div>
              <h1 className="font-serif text-4xl font-semibold my-1.5 text-ink">{p.title}</h1>
              <div className="text-muted text-sm">{conditionLabel(p.condition)} · {p.size ? `Rozmiar ${p.size}` : 'Uniwersalny'}{p.color ? ` · ${p.color}` : ''}</div>
            </div>
            <div>
              <div className="relative aspect-[4/3] rounded-2xl bg-gold-soft bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url('${gallery[active]}')` }}>
                <button className="absolute top-4 right-4 w-10 h-10 rounded-pill bg-white/92 flex items-center justify-center shadow-sm"><Icon name="heart" size={18} className="text-ink" /></button>
                {gallery.length > 1 && (
                  <>
                    <button onClick={() => setActive((active - 1 + gallery.length) % gallery.length)} aria-label="Poprzednie zdjęcie" className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-pill bg-white/92 flex items-center justify-center shadow-sm hover:bg-white transition-colors"><Icon name="arrowLeft" size={18} /></button>
                    <button onClick={() => setActive((active + 1) % gallery.length)} aria-label="Następne zdjęcie" className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-pill bg-white/92 flex items-center justify-center shadow-sm hover:bg-white transition-colors"><Icon name="arrowRight" size={18} /></button>
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-3">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`w-20 h-20 rounded-xl bg-gold-soft bg-cover bg-center ${i === active ? 'ring-2 ring-gold' : 'border border-line'}`} style={{ backgroundImage: `url('${src}')` }} />
                ))}
              </div>
            </div>

            <div className="mt-8 max-w-[600px]">
              <h3 className="font-serif text-xl font-semibold text-ink mb-3">Opis</h3>
              <div className="card-surface p-6">
                <div className={`space-y-3.5 ${!expanded && longDesc ? 'max-h-[168px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]' : ''}`}>
                  {paragraphs.map((para, i) => (
                    <p key={i} className="text-[15px] leading-[1.8] text-ink-soft">{para}</p>
                  ))}
                </div>
                {longDesc && (
                  <button onClick={() => setExpanded(!expanded)} className="mt-4 text-sm font-semibold text-gold inline-flex items-center gap-1.5">
                    {expanded ? 'Pokaż mniej' : 'Pokaż więcej'}
                    <Icon name="chevronRight" size={14} className={`transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PRAWA: dane produktu (sticky) */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="card-surface p-6">
              <div className="flex items-end justify-between gap-3">
                <div className="font-serif text-[34px] font-bold text-ink leading-none">{grosze(p.price)}</div>
                {raw.quantity > 1 && (
                  <span className="inline-flex items-center gap-1.5 bg-gold-soft text-gold-deep border border-gold/30 rounded-pill px-3 py-1.5 text-[13px] font-semibold shrink-0">
                    <Icon name="box" size={15} /> Dostępne: {raw.quantity} szt.
                  </span>
                )}
              </div>
              <div className="text-muted text-sm mt-2">{conditionLabel(p.condition)}{p.size ? ` · Rozmiar ${p.size}` : ''}{p.color ? ` · ${p.color}` : ''}</div>
              <div className="mt-5 space-y-3">
                <button onClick={() => router.push('/platnosc')} className="btn-dark w-full px-8 py-3.5 text-white font-semibold rounded-pill">Kup teraz</button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-pill border border-line text-ink font-semibold hover:border-gold transition-colors"><Icon name="heart" size={18} /> Dodaj do ulubionych</button>
                {canReserve && (
                  <button onClick={() => (user ? setResOpen(true) : openAuth('login'))} className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-pill border border-line text-ink font-semibold hover:border-gold transition-colors"><Icon name="clock" size={18} className="text-gold" /> Zarezerwuj</button>
                )}
                {raw.groupBuy && (
                  <button onClick={() => router.push('/kup-w-zespole')} className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-pill border border-gold text-ink font-semibold"><Icon name="users" size={18} className="text-gold" /> Kup w grupie</button>
                )}
              </div>
            </div>

            {/* sprzedawca */}
            <div className="card-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar name={seller?.displayName ?? 'Sprzedawca'} src={seller?.avatarUrl ?? undefined} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink flex items-center gap-1.5 truncate">
                    {seller?.displayName ?? 'Sprzedawca'}
                    {isBusiness && <span className="text-[10px] font-semibold text-gold bg-gold-soft px-2 py-0.5 rounded-pill shrink-0">Firma</span>}
                  </div>
                  <div className="text-xs text-muted flex items-center gap-1"><Icon name="star" size={12} className="text-gold" fill="currentColor" /> {(seller?.ratingAvg ?? 0).toFixed(1)} · {seller?.ratingCount ?? 0} opinii</div>
                </div>
              </div>
              <button onClick={contactSeller} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-pill border border-line text-ink font-semibold text-sm hover:border-gold transition-colors"><Icon name="chat" size={16} /> Wyślij wiadomość</button>
            </div>

            {/* dane produktu */}
            <div className="card-surface p-5">
              <h3 className="font-serif text-lg font-semibold text-ink mb-3">Dane produktu</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {details.map((d) => (
                  <div key={d.label} className="flex items-center gap-2 border border-line rounded-xl px-3 py-2.5">
                    <Icon name={d.icon} size={16} className="text-gold shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted">{d.label}</div>
                      <div className="text-[13px] font-semibold text-ink truncate">{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* pasek zaufania */}
            <div className="card-surface grid grid-cols-3 divide-x divide-line">
              {([
                { i: 'truck', t: 'Szybka wysyłka', s: '1–2 dni' },
                { i: 'shield', t: 'Bezpieczna płatność', s: 'BLIK / karta' },
                { i: 'refresh', t: 'Zwroty', s: 'do 14 dni' },
              ] as { i: IconName; t: string; s: string }[]).map((b) => (
                <div key={b.t} className="flex flex-col items-center gap-1 text-center px-2 py-3.5">
                  <Icon name={b.i} size={20} className="text-gold" />
                  <div className="text-[11px] font-semibold text-ink leading-tight">{b.t}</div>
                  <div className="text-[10px] text-muted">{b.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Podobne ogłoszenia (web) */}
        {similar.length > 0 && (
          <section className="mt-14 pt-12 border-t border-line">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-[12px] tracking-[0.18em] uppercase text-gold font-semibold mb-1">Może Ci się spodobać</div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">Podobne ogłoszenia</h2>
              </div>
              <button onClick={() => router.push(`/szukaj${raw.category?.slug ? `?categorySlug=${raw.category.slug}` : ''}`)} className="text-sm font-semibold uppercase tracking-[0.1em] text-gold flex items-center gap-1 whitespace-nowrap">Zobacz więcej <Icon name="arrowRight" size={15} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {similar.map((s) => <ShopCard key={s.id} p={s} />)}
            </div>
          </section>
        )}
      </div>

      {/* Modal rezerwacji */}
      {resOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/40" aria-label="Zamknij" onClick={() => setResOpen(false)} />
          <div className="relative w-full max-w-md card-surface p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-xl font-semibold text-ink">Zarezerwuj przedmiot</h3>
              <button onClick={() => setResOpen(false)} className="text-muted hover:text-ink"><Icon name="x" size={20} /></button>
            </div>
            <p className="text-sm text-muted mb-4">Wybierz okres rezerwacji — sprzedawca musi ją zaakceptować.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {RESERVATION_PERIODS.map((pr) => (
                <button key={pr.hours} onClick={() => setResHours(pr.hours)} className={`px-4 py-2 rounded-pill text-sm font-semibold border transition-colors ${resHours === pr.hours ? 'bg-gold-soft border-gold text-gold' : 'border-line text-ink-soft hover:border-gold'}`}>{pr.label}</button>
              ))}
            </div>
            <textarea value={resNote} onChange={(e) => setResNote(e.target.value.slice(0, 300))} placeholder="Wiadomość do sprzedawcy (opcjonalnie)" className="input-base h-24 resize-none w-full mb-3" />
            {resMsg && <p className="text-sm text-center text-gold mb-3">{resMsg}</p>}
            <button onClick={submitReservation} disabled={resBusy} className="btn-gold w-full py-3 text-white disabled:opacity-60">{resBusy ? 'Wysyłanie…' : 'Wyślij prośbę o rezerwację'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
