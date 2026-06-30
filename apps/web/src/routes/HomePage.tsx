'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IMG, grosze, conditionLabel } from '@modamarket/shared';
import type { Listing } from '@modamarket/shared';
import { fetchListings } from '../lib/api/listings';
import { Icon } from '../components/ui/Icon';
import { ShopCard } from '../components/product/ProductCard';

const HERO = '/hero3.png';
const MOBILE_CATS = [
  { label: 'Kobiety', img: IMG.dress },
  { label: 'Mężczyźni', img: IMG.blazer },
  { label: 'Torebki', img: IMG.bag },
  { label: 'Obuwie', img: IMG.sneaker },
  { label: 'Akcesoria', img: IMG.sunglasses },
];

/* ---- Desktop: sekcja siatki ---- */
function Section({ title, badge, items }: { title: string; badge: string; items: Listing[] }) {
  return (
    <section className="w-full max-w-[1860px] mx-auto px-5 md:px-10 py-10 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">{title}</h2>
          <span className="text-[11px] font-semibold text-gold bg-gold-soft px-2.5 py-1 rounded-pill">{badge}</span>
        </div>
        <Link href="/szukaj" className="text-sm font-semibold uppercase tracking-[0.1em] text-gold flex items-center gap-1">Zobacz wszystkie <Icon name="arrowRight" size={15} /></Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {items.map((p, i) => <ShopCard key={`${p.id}-${i}`} p={p} />)}
      </div>
    </section>
  );
}

/* ---- Mobile: karta produktu (biały kafelek) ---- */
function MobileCard({ p }: { p: Listing }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/produkt/${p.id}`)} className="card-surface overflow-hidden shadow-[0_6px_20px_rgba(40,30,20,0.05)]">
      <div className="relative aspect-[4/5] bg-gold-soft bg-cover bg-center" style={{ backgroundImage: `url('${p.imageUrl}')` }}>
        <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold bg-white/90 text-ink px-2 py-1 rounded-pill shadow-sm">{conditionLabel(p.condition)}</span>
        <button onClick={(e) => e.stopPropagation()} className="absolute top-2.5 right-2.5 w-9 h-9 rounded-pill bg-white/95 flex items-center justify-center shadow-sm">
          <Icon name="heart" size={16} className="text-ink" />
        </button>
      </div>
      <div className="p-3 text-center">
        <div className="font-serif text-[15px] font-bold text-ink leading-tight truncate">{p.title}</div>
        <div className="text-[12px] text-muted mt-0.5">{p.brand}</div>
        <div className="font-serif text-[17px] font-bold text-ink mt-1.5">{grosze(p.price)}</div>
      </div>
    </div>
  );
}

/* ---- Mobile: siatka produktów 2 kolumny ---- */
function MobileRow({ title, items }: { title: string; items: Listing[] }) {
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        <Link href="/szukaj" className="text-[12px] font-semibold text-gold">Zobacz wszystkie</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        {items.map((p, i) => <MobileCard key={`${p.id}-${i}`} p={p} />)}
      </div>
    </div>
  );
}

/* ---- Desktop: hero-slider (auto-zmiana slajdów) ---- */
function HeroSlider() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const COUNT = 2;
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % COUNT), 5500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="relative w-full h-[640px] overflow-hidden">
      {/* Slajd 1 — Nowa kolekcja */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover object-[64%_center]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(28,24,18,0.90) 0%, rgba(28,24,18,0.66) 32%, rgba(28,24,18,0.34) 56%, rgba(28,24,18,0.30) 78%, rgba(28,24,18,0.50) 100%)' }} />
        <div className="relative h-full w-full max-w-[1860px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="h-full flex flex-col justify-center max-w-3xl">
            <div className="text-[12px] md:text-[13px] tracking-[0.22em] font-semibold text-gold">KUPUJ I SPRZEDAWAJ MODĘ Z ZAUFANIEM</div>
            <div className="w-14 h-px bg-gold/70 mt-3 mb-7" />
            <h1 className="font-serif font-semibold text-[#F6F1E8] leading-[1.06] text-4xl md:text-6xl lg:text-[4.25rem] mb-6">Ponadczasowa elegancja,<br />wybrana dla Ciebie</h1>
            <p className="text-[#E6DECF]/85 text-base md:text-lg leading-relaxed mb-9 max-w-xl">Odkrywaj starannie wyselekcjonowane ubrania, dodatki i akcesoria od zaufanych sprzedawców i najlepszych marek.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => router.push('/szukaj')} className="btn-gold px-8 py-3.5 text-white">Odkryj kolekcję</button>
              <button onClick={() => router.push('/sprzedaj')} className="px-8 py-3.5 rounded-pill border border-[#C0913C]/55 text-[#F3ECDD] font-semibold hover:bg-white/5 transition-colors">Sprzedaj produkt</button>
            </div>
          </div>
          <div className="absolute bottom-14 left-6 md:left-10 lg:left-16 flex flex-wrap items-center gap-x-9 gap-y-2 text-[13px] text-[#E6DECF]/85">
            {[
              { i: 'shield', t: 'Autentyczność' },
              { i: 'lock', t: 'Bezpieczne zakupy' },
              { i: 'user', t: 'Zweryfikowani sprzedawcy' },
              { i: 'refresh', t: '14 dni na zwrot' },
            ].map((b) => (
              <span key={b.t} className="flex items-center gap-2.5"><span className="text-gold"><Icon name={b.i as any} size={17} /></span>{b.t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Slajd 2 — Kup w grupie */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${i === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <img src={IMG.group} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(30,27,22,0.94) 0%, rgba(30,27,22,0.72) 42%, rgba(30,27,22,0.25) 100%)' }} />
        <div className="relative h-full w-full max-w-[1860px] mx-auto px-6 md:px-10 lg:px-16 flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[12px] tracking-[0.2em] font-semibold text-gold mb-4"><Icon name="users" size={16} /> KUP W GRUPIE</div>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-[4rem] font-semibold text-white leading-[1.06] mb-5">Im więcej osób,<br />tym niższa cena</h2>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-md">Dołącz do grupy zakupowej, osiągnij próg i odbierz produkt w wyjątkowej cenie. Wyróżnik AdBox.</p>
            <button onClick={() => router.push('/kup-w-zespole')} className="btn-gold px-8 py-3.5 text-white">Zobacz grupy zakupowe</button>
          </div>
        </div>
      </div>

      {/* kropki */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {[0, 1].map((d) => (
          <button key={d} onClick={() => setI(d)} aria-label={`Slajd ${d + 1}`} className={`h-2 rounded-pill transition-all ${i === d ? 'w-7 bg-gold' : 'w-2.5 bg-white/50'}`} />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const router = useRouter();
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    fetchListings({ limit: 20, sort: 'newest' }).then((r) => setItems(r.items)).catch(() => {});
  }, []);

  const NOWOSCI = items.slice(0, 10);
  const WYBRANE = items.length > 10 ? items.slice(10, 20) : items.slice(0, 10);

  return (
    <div>
      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden px-4 pt-3 pb-2">
        {/* szukaj */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-pill px-4 py-2.5">
            <Icon name="search" size={17} className="text-muted" />
            <input placeholder="Szukaj marek, produktów, stylów…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" />
          </div>
          <button onClick={() => router.push('/szukaj')} className="w-11 rounded-pill bg-surface border border-line flex items-center justify-center text-ink shrink-0"><Icon name="sliders" size={18} /></button>
        </div>

        {/* hero-karta */}
        <div className="relative rounded-2xl overflow-hidden h-[220px]">
          <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover object-[62%_center]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(28,24,18,0.85) 0%, rgba(28,24,18,0.45) 45%, rgba(28,24,18,0.05) 78%)' }} />
          <div className="relative h-full flex flex-col justify-center px-5 max-w-[64%]">
            <span className="text-[10px] tracking-[0.18em] font-semibold text-gold mb-1.5">NOWA KOLEKCJA</span>
            <h2 className="font-serif text-xl font-semibold text-white leading-tight mb-2">Ponadczasowa elegancja</h2>
            <p className="text-[12px] text-white/80 leading-snug mb-3">Odkryj starannie wyselekcjonowane marki premium.</p>
            <button onClick={() => router.push('/szukaj')} className="btn-gold self-start px-4 py-2 text-white text-[11px] uppercase tracking-wide">Odkryj teraz</button>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 rounded-pill ${i === 0 ? 'w-4 bg-gold' : 'w-1.5 bg-white/50'}`} />)}
          </div>
        </div>

        {/* Kategorie — równo rozłożone */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-ink">Kategorie</h3>
            <Link href="/szukaj" className="text-[12px] font-semibold text-gold">Zobacz wszystkie</Link>
          </div>
          <div className="flex justify-between">
            {MOBILE_CATS.map((c) => (
              <button key={c.label} onClick={() => router.push('/szukaj')} className="flex flex-col items-center gap-1.5">
                <span className="w-[60px] h-[60px] rounded-pill bg-gold-soft bg-cover bg-center border border-line" style={{ backgroundImage: `url('${c.img}')` }} />
                <span className="text-[11px] text-ink-soft">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Polecane dla Ciebie + Aktualności (siatka 2 kol.) */}
        <MobileRow title="Polecane dla Ciebie" items={NOWOSCI.slice(0, 6)} />
        <MobileRow title="Aktualności" items={WYBRANE.slice(0, 6)} />

        {/* mini-baner Kup w grupie */}
        <div onClick={() => router.push('/kup-w-zespole')} className="relative rounded-2xl overflow-hidden h-[130px] mt-7">
          <img src={IMG.group} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(30,27,22,0.92) 0%, rgba(30,27,22,0.5) 100%)' }} />
          <div className="relative h-full flex flex-col justify-center px-5">
            <span className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] font-semibold text-gold mb-1"><Icon name="users" size={13} /> KUP W GRUPIE</span>
            <div className="font-serif text-lg font-semibold text-white leading-tight">Im więcej osób,<br />tym niższa cena</div>
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block">
        {/* HERO — slider (Nowa kolekcja + Kup w grupie) */}
        <HeroSlider />

        <Section title="Aktualności" badge="Świeżo dodane" items={NOWOSCI} />
        <Section title="Wybrane dla Ciebie" badge="Nowości co tydzień" items={WYBRANE} />

        {/* Baner B2B — tylko strona główna */}
        <section className="w-full max-w-[1860px] mx-auto px-5 md:px-10 pb-12">
          <div className="relative overflow-hidden rounded-2xl bg-ink min-h-[300px] flex">
            <img src="/hero2.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-55" />
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(28,24,18,0.94) 0%, rgba(28,24,18,0.72) 45%, rgba(28,24,18,0.30) 100%)' }} />
            <div className="relative w-full px-8 md:px-14 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-[12px] tracking-[0.2em] font-semibold text-gold mb-3"><Icon name="award" size={15} /> DLA FIRM</div>
                <h2 className="font-serif text-3xl md:text-[2.75rem] font-semibold text-white leading-tight mb-3">Prowadzisz firmę?</h2>
                <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl">Skontaktuj się z nami i poznaj naszą ofertę dla sprzedawców biznesowych — większa widoczność, narzędzia sprzedaży i „Kup w grupie".</p>
              </div>
              <button onClick={() => router.push('/kontakt')} className="btn-gold px-8 py-3.5 text-white whitespace-nowrap shrink-0">Skontaktuj się</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
