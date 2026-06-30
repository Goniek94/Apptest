'use client';
import { useEffect, useState } from 'react';
import { IMG, grosze } from '@modamarket/shared';
import { Icon, type IconName } from '../components/ui/Icon';

const STD = 29900;
const GROUP = 25900;
const JOINED = 3;
const THRESHOLD = 5;

const STEPS: { icon: IconName; n: string; title: string; sub: string }[] = [
  { icon: 'users', n: '1.', title: 'Dołącz do grupy', sub: 'Wejdź do istniejącej grupy lub stwórz własną.' },
  { icon: 'clock', n: '2.', title: 'Poczekaj na komplet', sub: 'Potrzebujemy 5 osób, aby odblokować niższą cenę.' },
  { icon: 'bag', n: '3.', title: 'Kup taniej', sub: 'Gdy grupa się zapełni, kupujesz w niższej cenie.' },
];

function useCountdown(start: number) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function GroupBuyPage() {
  const time = useCountdown(18 * 3600 + 42 * 60 + 15);
  const pct = Math.round((JOINED / THRESHOLD) * 100);

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 py-5 pb-8">
      <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink">Kup w grupie</h1>
      <p className="text-sm md:text-base text-muted mt-1 mb-5">Dołącz do wspólnego zakupu i odblokuj lepszą cenę.</p>

      {/* karta produktu */}
      <div className="card-surface overflow-hidden flex flex-col sm:flex-row mb-4">
        <div className="sm:w-[44%] h-52 sm:h-auto bg-gold-soft bg-cover bg-center" style={{ backgroundImage: `url('${IMG.nb}')` }} />
        <div className="flex-1 p-5">
          <h2 className="font-serif text-2xl font-semibold text-ink">Sneakersy 530</h2>
          <div className="text-sm text-muted">New Balance</div>
          <div className="border-t border-line my-4" />
          <div className="text-[13px] text-muted">Cena standardowa</div>
          <div className="font-serif text-xl font-bold text-ink">{grosze(STD)}</div>
          <div className="bg-gold-soft/50 border border-gold/25 rounded-xl px-4 py-3 mt-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gold"><Icon name="tag" size={15} /> Cena grupowa</div>
            <div className="font-serif text-3xl font-bold text-gold mt-0.5">{grosze(GROUP)}</div>
          </div>
        </div>
      </div>

      {/* postęp grupy */}
      <div className="card-surface p-5 mb-4">
        <div className="text-[15px] font-semibold text-ink mb-2">{JOINED} z {THRESHOLD} osób do odblokowania ceny</div>
        <div className="relative h-2.5 rounded-pill bg-line mb-4">
          <div className="absolute left-0 top-0 h-full rounded-pill bg-gold" style={{ width: `${pct}%` }} />
          <span className="absolute -top-2.5 -ml-3.5 w-7 h-7 rounded-pill btn-gold text-white flex items-center justify-center" style={{ left: `${pct}%` }}><Icon name="users" size={13} /></span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[13px] text-muted mb-2">Uczestnicy</div>
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => <img key={i} src={IMG.avatar} alt="" className="w-11 h-11 rounded-pill object-cover border-2 border-surface" />)}
              {[0, 1].map((i) => <span key={i} className="w-11 h-11 rounded-pill bg-gold-soft border-2 border-surface flex items-center justify-center text-muted"><Icon name="user" size={16} /></span>)}
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-[12px] text-muted">Kończy się za</div>
            <div className="font-serif text-2xl font-bold text-ink tabular-nums">{time}</div>
            <Icon name="clock" size={16} className="text-gold mx-auto mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-2 bg-gold-soft/40 border border-line rounded-xl px-3.5 py-3 text-[13px] text-ink"><Icon name="tag" size={17} className="text-gold shrink-0" /> Oszczędzasz {grosze(STD - GROUP)}</div>
          <div className="flex items-center gap-2 bg-gold-soft/40 border border-line rounded-xl px-3.5 py-3 text-[13px] text-ink"><Icon name="truck" size={17} className="text-gold shrink-0" /> Darmowa dostawa po odblokowaniu</div>
        </div>
      </div>

      {/* jak to działa */}
      <div className="card-surface p-5 mb-5">
        <h3 className="font-serif text-lg font-semibold text-ink mb-4">Jak to działa?</h3>
        <div className="flex items-stretch gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-stretch gap-2 flex-1">
              <div className="flex-1 border border-line rounded-xl p-3 text-center">
                <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center mx-auto mb-2"><Icon name={s.icon} size={18} /></span>
                <div className="font-serif text-base font-bold text-gold">{s.n}</div>
                <div className="text-[12px] font-semibold text-ink leading-tight mt-0.5">{s.title}</div>
                <div className="text-[10px] text-muted leading-tight mt-1 hidden sm:block">{s.sub}</div>
              </div>
              {i < STEPS.length - 1 && <Icon name="chevronRight" size={16} className="text-muted self-center shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* akcje */}
      <button className="btn-gold w-full py-4 text-white font-semibold mb-3">Dołącz do grupy <Icon name="users" size={18} /></button>
      <button className="w-full flex items-center justify-center gap-2 py-4 rounded-pill border border-gold text-gold font-semibold">Stwórz własną grupę <Icon name="plus" size={18} /></button>
    </div>
  );
}
