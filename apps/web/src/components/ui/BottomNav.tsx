'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/szukaj', label: 'Szukaj', icon: 'search' },
  { to: '/ulubione', label: 'Ulubione', icon: 'heart' },
  { to: '/profil', label: 'Profil', icon: 'user' },
];

/** Dolna nawigacja z makiet — środkowy złoty „+" do wystawiania ogłoszeń. */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  const Tab = ({ to, label, icon }: { to: string; label: string; icon: IconName }) => {
    const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
    return (
      <Link href={to} className="flex-1 flex flex-col items-center gap-[3px] py-1">
        <span className={active ? 'text-gold' : 'text-muted'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Icon name={icon} size={22} />
          <span className="text-[10px] font-medium">{label}</span>
        </span>
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 mx-auto max-w-phone h-[70px] bg-surface border-t border-line flex items-center px-2">
      {left.map((t) => <Tab key={t.to} {...t} />)}
      <button
        onClick={() => router.push('/sprzedaj')}
        className="btn-gold -mt-7 w-14 h-14 rounded-pill text-white text-3xl shrink-0"
        aria-label="Dodaj ogłoszenie"
      >
        <Icon name="plus" size={26} />
      </button>
      {right.map((t) => <Tab key={t.to} {...t} />)}
    </nav>
  );
}
