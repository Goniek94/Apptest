'use client';
import { useState } from 'react';
import { Icon, type IconName } from '../components/ui/Icon';

const HERO = '/hero4.png';

const INFO: { icon: IconName; label: string; lines: string[] }[] = [
  { icon: 'mail', label: 'Email', lines: ['kontakt@modamarket.pl'] },
  { icon: 'phone', label: 'Telefon', lines: ['+48 123 456 789', 'Pon. – Pt. 9:00 – 17:00'] },
  { icon: 'mapPin', label: 'Adres', lines: ['ul. Moda 12, 00-001 Warszawa, Polska'] },
];

const PERKS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'chat', title: 'Wsparcie klienta', desc: 'Odpowiemy na Twoje pytania tak szybko, jak to możliwe.' },
  { icon: 'shield', title: 'Bezpieczeństwo', desc: 'Twoje dane są u nas bezpieczne i chronione.' },
  { icon: 'clock', title: 'Szybka odpowiedź', desc: 'Zazwyczaj odpowiadamy w ciągu 24 godzin w dni robocze.' },
];

const TOPICS = ['Pytanie ogólne', 'Problem z zamówieniem', 'Współpraca / firma', 'Zgłoszenie nadużycia', 'Inne'];

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function submit() {
    setError('');
    if (name.trim().length < 2) return setError('Podaj imię i nazwisko.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Podaj poprawny adres e-mail.');
    if (message.trim().length < 5) return setError('Wpisz treść wiadomości.');
    setSent(true);
  }

  return (
    <div className="relative">
      {/* lewy pasek ze zdjęciem (desktop) */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[15%] bg-cover bg-center" style={{ backgroundImage: `url('${HERO}')` }} />

      <div className="w-full max-w-[1560px] mx-auto px-5 lg:pl-[17%] lg:pr-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_1.25fr_0.95fr] gap-8 lg:gap-10 items-start">

          {/* LEWA — nagłówek + dane */}
          <div>
            <div className="text-[12px] tracking-[0.22em] font-semibold text-gold mb-3">KONTAKT</div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink leading-[1.05]">Skontaktuj się<br />z nami</h1>
            <div className="w-12 h-px bg-gold/70 my-6" />
            <p className="text-ink-soft leading-relaxed mb-8 max-w-sm">Masz pytania, potrzebujesz pomocy lub chcesz dowiedzieć się więcej? Jesteśmy tu, aby Ci pomóc.</p>

            <div className="space-y-5">
              {INFO.map((it) => (
                <div key={it.label} className="flex items-start gap-3.5">
                  <span className="w-11 h-11 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={it.icon} size={18} /></span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-ink">{it.label}</div>
                    {it.lines.map((l, i) => <div key={i} className="text-[13px] text-muted">{l}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ŚRODEK — formularz */}
          <div className="card-surface p-6 md:p-8 shadow-[0_16px_40px_rgba(40,30,20,0.06)]">
            <h2 className="font-serif text-2xl font-semibold text-ink mb-6">Napisz do nas</h2>
            {sent ? (
              <div className="text-center py-10">
                <span className="w-14 h-14 rounded-pill bg-gold-soft text-gold flex items-center justify-center mx-auto mb-4"><Icon name="send" size={24} /></span>
                <div className="font-serif text-xl font-semibold text-ink">Wiadomość wysłana!</div>
                <p className="text-sm text-muted mt-1.5">Dziękujemy — odpowiemy najszybciej, jak to możliwe.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Imię i nazwisko" className="input-base w-full" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input-base w-full" />
                <div className="relative">
                  <select value={topic} onChange={(e) => setTopic(e.target.value)} className="input-base w-full appearance-none pr-10 cursor-pointer text-ink">
                    <option value="">Temat wiadomości</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Icon name="chevronDown" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} placeholder="Twoja wiadomość" className="input-base w-full h-36 resize-none" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit} className="btn-dark w-full py-3.5 rounded-pill text-white font-semibold flex items-center justify-center gap-2">
                  Wyślij wiadomość <Icon name="send" size={17} />
                </button>
              </div>
            )}
          </div>

          {/* PRAWA — karty atutów */}
          <div className="space-y-4">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-gold-soft/40 border border-line rounded-2xl p-5 flex items-start gap-3.5">
                <span className="w-10 h-10 rounded-pill bg-surface text-gold flex items-center justify-center shrink-0 border border-gold/20"><Icon name={p.icon} size={18} /></span>
                <div>
                  <div className="font-semibold text-ink text-[15px]">{p.title}</div>
                  <p className="text-[13px] text-muted leading-relaxed mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
