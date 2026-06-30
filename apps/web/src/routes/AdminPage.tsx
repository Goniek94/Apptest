'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../components/ui/Icon';
import { fetchAdminStats, type AdminStats } from '../lib/api/admin';

const URGENT: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'bag', title: '6 ogłoszeń do akceptacji', sub: 'Wymagają Twojej weryfikacji' },
  { icon: 'flag', title: '2 zgłoszenia użytkowników', sub: 'Oczekują na Twoją odpowiedź' },
  { icon: 'shield', title: '1 reklamacja do rozpatrzenia', sub: 'Wymaga podjęcia decyzji' },
];

const MANAGE: { icon: IconName; title: string; href: string }[] = [
  { icon: 'users', title: 'Użytkownicy', href: '/admin/uzytkownicy' },
  { icon: 'tag', title: 'Ogłoszenia', href: '/admin/ogloszenia' },
  { icon: 'box', title: 'Transakcje', href: '/admin/transakcje' },
  { icon: 'refresh', title: 'Zwroty i reklamacje', href: '/admin/zwroty' },
  { icon: 'mail', title: 'Wiadomości systemowe', href: '/admin/wiadomosci' },
  { icon: 'chart', title: 'Statystyki', href: '/admin/statystyki' },
  { icon: 'settings', title: 'Ustawienia platformy', href: '/admin/ustawienia' },
];

const ACTIVITY: { icon: IconName; title: string; who: string; time: string }[] = [
  { icon: 'bag', title: 'Zaakceptowano ogłoszenie „Trencz klasyczny"', who: 'przez Admin', time: '09:20' },
  { icon: 'flag', title: 'Zgłoszenie użytkownika #1287 zostało zamknięte', who: 'przez Moderator', time: '08:45' },
  { icon: 'shield', title: 'Reklamacja #556 oznaczona jako rozwiązana', who: 'przez Admin', time: 'Wczoraj, 17:30' },
];

function Section({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        {action && <button className="text-[13px] font-semibold text-gold flex items-center gap-1">{action} <Icon name="chevronRight" size={13} /></button>}
      </div>
      {children}
    </div>
  );
}

export function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => { fetchAdminStats().then(setStats).catch(() => {}); }, []);

  const cards: { icon: IconName; label: string; value: string }[] = [
    { icon: 'user', label: 'Użytkownicy', value: String(stats?.users ?? '—') },
    { icon: 'bag', label: 'Ogłoszenia (aktywne)', value: String(stats?.activeListings ?? '—') },
    { icon: 'flag', label: 'Do weryfikacji', value: String(stats?.unverifiedListings ?? '—') },
    { icon: 'shield', label: 'Zbanowani', value: String(stats?.banned ?? '—') },
  ];

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-5 pb-8">
      <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink">Panel administracyjny</h1>
      <p className="text-sm text-muted mt-1">Zarządzanie platformą i moderacja.</p>

      {/* statystyki */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {cards.map((s) => (
          <div key={s.label} className="card-surface p-4">
            <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center mb-2"><Icon name={s.icon} size={18} /></span>
            <div className="text-[12px] text-muted leading-tight">{s.label}</div>
            <div className="font-serif text-2xl font-bold text-ink leading-none mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* do pilnej akcji */}
      <Section title="Do pilnej akcji" action="Zobacz wszystkie">
        <div className="card-surface divide-y divide-line overflow-hidden">
          {URGENT.map((u) => (
            <button key={u.title} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
              <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={u.icon} size={17} /></span>
              <div className="flex-1 min-w-0"><div className="text-[14px] font-semibold text-ink">{u.title}</div><div className="text-[12px] text-muted">{u.sub}</div></div>
              <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
            </button>
          ))}
        </div>
      </Section>

      {/* szybkie zarządzanie */}
      <Section title="Szybkie zarządzanie">
        <div className="card-surface divide-y divide-line overflow-hidden">
          {MANAGE.map((m) => (
            <button key={m.title} onClick={() => router.push(m.href)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left">
              <span className="w-9 h-9 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={m.icon} size={16} /></span>
              <span className="flex-1 text-[15px] text-ink">{m.title}</span>
              <Icon name="chevronRight" size={18} className="text-muted shrink-0" />
            </button>
          ))}
        </div>
      </Section>

      {/* ostatnia aktywność */}
      <Section title="Ostatnia aktywność" action="Zobacz wszystkie">
        <div className="card-surface divide-y divide-line overflow-hidden">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="w-9 h-9 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={a.icon} size={16} /></span>
              <div className="flex-1 min-w-0"><div className="text-[13px] font-medium text-ink leading-snug">{a.title}</div><div className="text-[12px] text-muted">{a.who}</div></div>
              <span className="text-[12px] text-muted shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
