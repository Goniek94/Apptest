'use client';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../components/ui/Icon';
import { openAuth } from '../lib/auth';

const STATS: { value: string; label: string }[] = [
  { value: '12k+', label: 'Użytkowników' },
  { value: '98%', label: 'Pozytywnych ocen' },
  { value: '50k+', label: 'Transakcji' },
];

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'award', title: 'Autentyczność', desc: 'Każdy produkt jest opisany rzetelnie, a sprzedawcy budują reputację w oparciu o zaufanie i uczciwość.' },
  { icon: 'shield', title: 'Bezpieczne zakupy', desc: 'Bezpieczne płatności, ochrona kupujących i wsparcie zespołu na każdym etapie transakcji.' },
  { icon: 'users', title: 'Społeczność premium', desc: 'Dołącz do społeczności miłośników mody premium. Wymieniaj się doświadczeniami i inspiracjami.' },
];

const STEPS: { n: string; title: string; desc: string }[] = [
  { n: '01', title: 'Wystaw lub znajdź', desc: 'Dodaj ogłoszenie w kilka minut albo przeglądaj sprawdzone oferty premium.' },
  { n: '02', title: 'Kup bezpiecznie', desc: 'Płatność jest chroniona, a środki trafiają do sprzedawcy dopiero po odbiorze.' },
  { n: '03', title: 'Buduj reputację', desc: 'Oceny i opinie tworzą zaufaną, premium społeczność.' },
];

export function AboutPage() {
  const router = useRouter();
  return (
    <div className="w-full max-w-[1760px] mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* hero — 2 kolumny, tekst po lewej */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-14 md:mb-16">
        <div>
          <div className="flex items-center gap-3 mb-5"><span className="text-[12px] tracking-[0.22em] font-semibold text-gold">O NAS</span><span className="w-10 h-px bg-gold/50" /></div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] font-semibold text-ink leading-[1.08] mb-6">Tworzymy modę,<br />której można ufać</h1>
          <p className="text-ink-soft text-base md:text-lg leading-relaxed max-w-xl mb-8">ModaMarket to miejsce, gdzie pasja do stylu spotyka się z bezpieczeństwem. Kupuj i sprzedawaj autentyczne ubrania, obuwie i akcesoria w społeczności sprawdzonych użytkowników.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => router.push('/szukaj')} className="btn-gold px-7 py-3.5 text-white font-semibold">Przeglądaj ogłoszenia</button>
            <button onClick={() => openAuth('register')} className="px-7 py-3.5 rounded-pill border border-ink text-ink font-semibold hover:bg-ink hover:text-white transition-colors">Załóż konto</button>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-gold-soft">
          <img src="/hero3.png" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* statystyki — pełny rząd z liniami */}
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line mb-14 md:mb-16">
        {STATS.map((s) => (
          <div key={s.label} className="text-center py-7">
            <div className="font-serif text-3xl md:text-4xl font-bold text-gold">{s.value}</div>
            <div className="text-[11px] md:text-xs tracking-wide uppercase text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* cechy — 3 kolumny z pionowymi liniami */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line mb-14 md:mb-16">
        {FEATURES.map((f) => (
          <div key={f.title} className="px-0 md:px-7 py-7 first:md:pl-0 last:md:pr-0">
            <span className="w-12 h-12 rounded-pill bg-gold-soft text-gold flex items-center justify-center mb-4"><Icon name={f.icon} size={20} /></span>
            <h3 className="font-serif text-xl font-semibold text-ink mb-2">{f.title}</h3>
            <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* jak to działa — kroki po lewej, zdjęcie po prawej */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-14 md:mb-16">
        <div className="lg:order-2 rounded-2xl overflow-hidden aspect-[4/3] bg-gold-soft">
          <img src="/hero4.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="lg:order-1">
          <span className="text-[12px] tracking-[0.22em] font-semibold text-gold">JAK TO DZIAŁA</span>
          <div className="mt-6 space-y-7">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="font-serif text-2xl font-bold text-gold/50 shrink-0 w-8">{s.n}</span>
                <div>
                  <h4 className="font-serif text-lg font-semibold text-ink">{s.title}</h4>
                  <p className="text-sm text-ink-soft leading-relaxed mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — szeroki pas */}
      <div className="card-surface px-6 md:px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">Dołącz do ModaMarket</h2>
          <p className="text-ink-soft mt-1">Zacznij kupować i sprzedawać modę premium już dziś.</p>
        </div>
        <button onClick={() => openAuth('register')} className="btn-gold px-8 py-3.5 text-white font-semibold shrink-0">Załóż konto</button>
      </div>
    </div>
  );
}
