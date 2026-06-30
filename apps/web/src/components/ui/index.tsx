import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'dark' | 'ghost' | 'outline';
  full?: boolean;
  icon?: IconName;
};

export function Button({ variant = 'gold', full, icon, className = '', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold text-[15px] rounded-pill px-6 py-3.5 transition-colors disabled:opacity-50';
  const styles: Record<string, string> = {
    gold: 'btn-gold',
    dark: 'btn-dark',
    ghost: 'bg-surface text-ink border border-line hover:border-gold',
    outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-white',
  };
  return (
    <button className={`${base} ${styles[variant]} ${full ? 'w-full' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'gold' | 'success' }) {
  const tones: Record<string, string> = {
    dark: 'bg-ink/80 text-white',
    gold: 'bg-gold text-white',
    success: 'bg-success/12 text-success',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-pill ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Pill({ active, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`whitespace-nowrap text-[13px] font-medium px-4 py-2 rounded-pill border transition-colors ${
        active ? 'bg-ink text-white border-ink' : 'bg-surface text-ink border-line hover:border-gold'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, src, size = 44 }: { name?: string; src?: string; size?: number }) {
  if (src) {
    return <img src={src} alt={name ?? ''} className="rounded-pill object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-pill bg-gold text-white font-serif flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export function Field({
  label,
  hint,
  icon,
  right,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: ReactNode; icon?: IconName; right?: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-2">{label}</span>}
      <div className="relative flex items-center">
        {icon && <Icon name={icon} size={18} className="absolute left-4 text-muted" />}
        <input className={`input-base ${icon ? 'pl-11' : ''} ${right ? 'pr-11' : ''}`} {...rest} />
        {right && <span className="absolute right-3 text-muted">{right}</span>}
      </div>
      {hint && <span className="block text-xs text-muted mt-1.5">{hint}</span>}
    </label>
  );
}

export function SectionHead({ title, action, big }: { title: string; action?: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className={`font-serif font-semibold text-ink ${big ? 'text-xl' : 'text-[17px]'}`}>{title}</h2>
      {action && <button className="text-[13px] font-semibold text-gold">{action}</button>}
    </div>
  );
}

export function IconButton({ name, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { name: IconName; badge?: boolean }) {
  return (
    <button className="relative text-ink hover:text-gold transition-colors" {...rest}>
      <Icon name={name} size={22} />
      {badge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-pill bg-gold" />}
    </button>
  );
}

export { Icon };
export type { IconName };
