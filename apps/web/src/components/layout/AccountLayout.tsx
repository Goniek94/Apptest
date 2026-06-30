'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../ui/Icon';
import { logout, useCurrentUser } from '../../lib/auth';

type Key = 'przeglad' | 'oferty' | 'dodaj' | 'zamowienia' | 'ulubione' | 'wiadomosci' | 'powiadomienia' | 'portfel' | 'platnosci' | 'ustawienia';

const SECTIONS: { key: Key; label: string; icon: IconName; href: string }[][] = [
  [
    { key: 'przeglad', label: 'Panel główny', icon: 'dashboard', href: '/profil' },
    { key: 'oferty', label: 'Moje ogłoszenia', icon: 'list', href: '/moje-ogloszenia' },
    { key: 'wiadomosci', label: 'Wiadomości', icon: 'chat', href: '/wiadomosci' },
    { key: 'powiadomienia', label: 'Powiadomienia', icon: 'bell', href: '/powiadomienia' },
  ],
  [
    { key: 'zamowienia', label: 'Transakcje', icon: 'box', href: '/zamowienie' },
    { key: 'ulubione', label: 'Ulubione', icon: 'heart', href: '/ulubione' },
    { key: 'portfel', label: 'Portfel', icon: 'wallet', href: '/portfel' },
  ],
  [
    { key: 'ustawienia', label: 'Ustawienia konta', icon: 'settings', href: '/ustawienia' },
  ],
];

export function AccountLayout({ active, children }: { active: Key; children: ReactNode }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const role = user?.role === 'ADMIN' ? 'Administrator' : user?.accountType === 'BUSINESS' ? 'Firma' : 'Użytkownik';

  return (
    <div className="w-full px-6 md:px-12 py-6 md:py-8">
      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8">
        <aside className="hidden md:block">
          <nav className="card-surface p-3 flex flex-col h-full min-h-[calc(100vh-12rem)]">
            {/* sekcje nawigacji */}
            <div className="flex flex-col pt-1">
              {SECTIONS.map((section, si) => (
                <div key={si} className={si > 0 ? 'mt-2 pt-2 border-t border-line' : ''}>
                  {section.map((it) => {
                    const on = active === it.key;
                    return (
                      <button
                        key={it.key}
                        onClick={() => router.push(it.href)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${on ? 'bg-gold-soft text-ink font-semibold' : 'text-ink-soft hover:bg-bg'}`}
                      >
                        <Icon name={it.icon} size={18} className={on ? 'text-gold' : 'text-muted'} />
                        {it.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* wsparcie */}
            <div className="mt-2 pt-2 border-t border-line">
              <button onClick={() => router.push('/pomoc')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-ink-soft hover:bg-bg transition-colors">
                <Icon name="help" size={18} className="text-muted" /> Pomoc i wsparcie
              </button>
              <button onClick={() => router.push('/kontakt')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-ink-soft hover:bg-bg transition-colors">
                <Icon name="chat" size={18} className="text-muted" /> Kontakt z obsługą
              </button>
            </div>

            {/* CTA — dodaj ogłoszenie */}
            <button onClick={() => router.push('/sprzedaj')} className="btn-gold w-full py-3 text-white font-semibold mt-3">
              <Icon name="plus" size={17} /> Dodaj ogłoszenie
            </button>

            {/* karta użytkownika */}
            <div className="mt-3 pt-3 border-t border-line flex items-center gap-3 px-1">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-pill object-cover border border-line shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center font-serif font-bold border border-line shrink-0">{(user?.displayName ?? '?').charAt(0).toUpperCase()}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{user?.displayName ?? 'Użytkownik'}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-gold">{role}</div>
              </div>
              <button onClick={() => { logout(); router.push('/'); }} aria-label="Wyloguj się" className="w-9 h-9 rounded-pill flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                <Icon name="logout" size={18} />
              </button>
            </div>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
