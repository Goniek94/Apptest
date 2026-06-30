'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { grosze } from '@modamarket/shared';
import { Icon, type IconName } from '../components/ui/Icon';
import { useAuth, useCurrentUser, logout, openAuth } from '../lib/auth';
import { useBadges } from '../lib/useBadges';
import { fetchWallet } from '../lib/api/orders';
import { AuthModal } from '../components/auth/AuthModal';

// Widok PRZED zalogowaniem (publiczny / landing)
const NAV = [
  { label: 'Strona Główna', href: '/' },
  { label: 'O nas', href: '/o-nas' },
  { label: 'Sklep', href: '/szukaj' },
  { label: 'Kontakt', href: '/kontakt' },
];

const MENU: { label: string; href: string; icon: IconName; badge?: 'messages' | 'notifications' }[] = [
  { label: 'Panel główny', href: '/profil', icon: 'dashboard' },
  { label: 'Moje ogłoszenia', href: '/moje-ogloszenia', icon: 'list' },
  { label: 'Powiadomienia', href: '/powiadomienia', icon: 'bell', badge: 'notifications' },
  { label: 'Wiadomości', href: '/wiadomosci', icon: 'chat', badge: 'messages' },
  { label: 'Ulubione', href: '/ulubione', icon: 'heart' },
  { label: 'Portfel', href: '/portfel', icon: 'wallet' },
  { label: 'Ustawienia konta', href: '/ustawienia', icon: 'settings' },
];

function Avatar({ user, size }: { user: { displayName: string; avatarUrl: string | null } | null; size: number }) {
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt="" className="rounded-pill object-cover border border-line" style={{ width: size, height: size }} />;
  return (
    <span className="rounded-pill bg-gold-soft text-gold flex items-center justify-center font-serif font-bold border border-line shrink-0" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(user?.displayName ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}

/** Saldo w nagłówku — dostępne środki, prowadzi do Portfela. */
function Saldo() {
  const router = useRouter();
  const [available, setAvailable] = useState<number | null>(null);
  useEffect(() => { fetchWallet().then((w) => setAvailable(w.available)).catch(() => {}); }, []);
  return (
    <button onClick={() => router.push('/portfel')} className="hidden lg:flex items-center gap-2 bg-surface border border-line rounded-pill px-3.5 py-2 hover:border-gold transition-colors" aria-label="Portfel">
      <span className="w-7 h-7 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name="wallet" size={15} /></span>
      <span className="text-[13px] font-semibold text-ink whitespace-nowrap">{available === null ? '— zł' : grosze(available)}</span>
    </button>
  );
}

function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const badges = useBadges();
  const counts: Record<string, number> = { messages: badges.messages, notifications: badges.notifications };
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 group">
        <span className="relative">
          <Avatar user={user} size={36} />
          {badges.total > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-pill bg-gold text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg">{badges.total > 99 ? '99+' : badges.total}</span>
          )}
        </span>
        <Icon name="chevronDown" size={15} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label="Zamknij menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-xl border border-line bg-surface shadow-[0_20px_50px_rgba(40,30,20,0.12)] p-2">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{user?.displayName ?? 'Użytkownik'}</div>
                <div className="text-xs text-muted truncate">{user?.email ?? ''}</div>
              </div>
            </div>
            <div className="h-px bg-line my-1" />
            {MENU.map((m) => {
              const n = m.badge ? counts[m.badge] : 0;
              return (
                <button
                  key={m.label}
                  onClick={() => { setOpen(false); router.push(m.href); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-bg transition-colors text-left"
                >
                  <Icon name={m.icon} size={17} className="text-muted" />
                  <span className="flex-1">{m.label}</span>
                  {n > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-pill bg-gold text-white text-[10px] font-bold flex items-center justify-center">{n > 99 ? '99+' : n}</span>}
                </button>
              );
            })}
            <div className="h-px bg-line my-1" />
            <button
              onClick={() => { setOpen(false); logout(); router.push('/'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-bg transition-colors text-left"
            >
              <Icon name="logout" size={17} /> Wyloguj się
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Logo({ light, size = 22 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-gold"><Icon name="hanger" size={size + 2} /></span>
      <span className={`font-serif font-bold ${light ? 'text-white' : 'text-ink'}`} style={{ fontSize: size }}>AdBox</span>
    </Link>
  );
}

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const authed = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-line">
      {/* MOBILE: logo + ulubione + dzwonek */}
      <div className="md:hidden flex items-center justify-between px-4 h-14">
        <Logo size={18} />
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(authed ? '/ulubione' : '/logowanie')} className="text-ink" aria-label="Ulubione"><Icon name="heart" size={21} /></button>
          <button onClick={() => router.push(authed ? '/powiadomienia' : '/logowanie')} className="relative text-ink" aria-label="Powiadomienia">
            <Icon name="bell" size={21} />
            {authed && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-pill bg-gold" />}
          </button>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex w-full px-5 md:px-8 h-[68px] items-center gap-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link key={n.label} href={n.href} className={`text-sm uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${active ? 'text-gold font-semibold' : 'text-ink hover:text-gold'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 md:gap-3.5 ml-auto">
          <button onClick={() => router.push('/sprzedaj')} className="btn-gold px-3 md:px-3.5 py-2 text-white text-[12px] uppercase tracking-[0.1em] whitespace-nowrap">
            <Icon name="plus" size={14} /> Dodaj ogłoszenie
          </button>

          {authed ? (
            <>
              <Saldo />
              <UserMenu />
            </>
          ) : (
            <button onClick={() => openAuth('login')} className="text-sm font-semibold uppercase tracking-[0.12em] text-ink hover:text-gold transition-colors whitespace-nowrap">
              Zaloguj się
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="w-full max-w-[1860px] mx-auto px-8 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Logo />
          <p className="text-muted text-sm mt-3 max-w-xs">Marketplace mody premium. Kupuj i sprzedawaj autentyczne rzeczy z zaufaniem.</p>
        </div>
        {[
          { h: 'Zakupy', items: ['Damskie', 'Męskie', 'Obuwie', 'Torebki'] },
          { h: 'Pomoc', items: ['Centrum pomocy', 'Dostawa', 'Zwroty', 'Kontakt'] },
          { h: 'Firma', items: ['O nas', 'Regulamin', 'Prywatność', 'Kariera'] },
        ].map((col) => (
          <div key={col.h}>
            <div className="font-semibold text-ink mb-3">{col.h}</div>
            <ul className="space-y-2 text-sm text-muted">
              {col.items.map((i) => <li key={i}><a className="hover:text-gold cursor-pointer">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© 2026 AdBox · Fashion Premium Marketplace</div>
    </footer>
  );
}

const TABS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Strona główna', href: '/', icon: 'home' },
  { label: 'Sklep', href: '/szukaj', icon: 'bag' },
  { label: 'Sprzedaj', href: '/sprzedaj', icon: 'plus' },
  { label: 'Wiadomości', href: '/wiadomosci', icon: 'chat' },
  { label: 'Profil', href: '/profil', icon: 'user' },
];

function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink text-white flex items-stretch px-1 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
      {TABS.map((t) => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
        return (
          <Link key={t.label} href={t.href} className={`flex flex-col items-center justify-center gap-1 flex-1 basis-0 py-1 transition-colors ${active ? 'text-gold' : 'text-white/55'}`}>
            <Icon name={t.icon} size={22} strokeWidth={active ? 2 : 1.8} />
            <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>
      <div className="hidden md:block"><Footer /></div>
      <MobileTabBar />
      <AuthModal />
    </div>
  );
}
