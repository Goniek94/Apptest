'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { grosze } from '@modamarket/shared';
import { Icon } from '../components/ui/Icon';
import { AccountLayout } from '../components/layout/AccountLayout';
import { fetchWallet, fetchMyOrders, type WalletSummary, type ApiOrder } from '../lib/api/orders';
import { useCurrentUser, openAuth } from '../lib/auth';

function OpRow({ o, meId }: { o: ApiOrder; meId: string }) {
  const isSale = o.sellerId === meId;
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={isSale ? 'wallet' : 'bag'} size={17} /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-ink truncate">{isSale ? 'Sprzedaż' : 'Zakup'} · {o.listing.title}</div>
        <div className="text-[12px] text-muted">{new Date(o.createdAt).toLocaleDateString('pl-PL')}</div>
      </div>
      <div className="text-right">
        <div className={`text-[14px] font-bold ${isSale ? 'text-success' : 'text-ink'}`}>{isSale ? '+' : '−'}{grosze(o.amount - (isSale ? o.commission : 0))}</div>
        <div className="text-[12px] text-muted">{o.status === 'COMPLETED' ? 'Rozliczone' : 'W toku'}</div>
      </div>
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="flex items-center gap-3 bg-gold-soft/40 border border-line rounded-xl px-4 py-3">
      <Icon name="shield" size={20} className="text-gold shrink-0" />
      <div>
        <div className="text-[13px] font-semibold text-ink">Bezpieczne wypłaty</div>
        <div className="text-[12px] text-muted">Dbamy o bezpieczeństwo Twoich środków i poufność danych.</div>
      </div>
    </div>
  );
}

export function WalletPage() {
  const router = useRouter();
  const { user, hydrated } = useCurrentUser();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchWallet().then(setWallet).catch(() => {});
    fetchMyOrders().then(setOrders).catch(() => {});
  }, [user]);

  const available = wallet?.available ?? 0;
  const pending = wallet?.pending ?? 0;
  const total = available + pending;
  const ops = orders.slice(0, 8);

  return (
    <AccountLayout active="portfel">
      <div className="md:hidden flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-ink"><Icon name="arrowLeft" size={20} /></button>
        <h1 className="font-serif text-lg font-semibold text-ink flex-1 text-center pr-6">Portfel</h1>
      </div>
      <h1 className="hidden md:block font-serif text-2xl font-semibold text-ink mb-6">Portfel</h1>

      {!user && hydrated ? (
        <div className="text-center py-16 text-muted text-sm">Zaloguj się, aby zobaczyć portfel.<button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button></div>
      ) : (
        <div className="md:max-w-3xl">
          <div className="card-surface p-5 md:p-6 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] text-muted">Dostępne środki</div>
                <div className="font-serif text-[30px] md:text-4xl font-bold text-ink mt-1">{grosze(available)}</div>
                <div className="text-[13px] text-muted mt-2">Łączne saldo <span className="text-ink font-medium">{grosze(total)}</span></div>
              </div>
              <span className="w-14 h-14 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name="wallet" size={24} /></span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button className="btn-gold py-3 text-white font-semibold">Wypłać środki <Icon name="refresh" size={16} /></button>
              <button className="py-3 rounded-pill border border-line bg-surface text-ink font-semibold flex items-center justify-center gap-2 hover:border-gold transition-colors">Historia <Icon name="clock" size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card-surface p-4">
              <div className="text-[13px] text-muted">Dostępne do wypłaty</div>
              <div className="font-serif text-xl font-bold text-ink mt-1">{grosze(available)}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-[13px] text-muted">Oczekujące środki</div>
              <div className="font-serif text-xl font-bold text-ink mt-1">{grosze(pending)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-lg font-semibold text-ink">Ostatnie operacje</h2>
            <span className="text-[13px] text-muted">{wallet?.salesCount ?? 0} sprzedaży</span>
          </div>
          <div className="card-surface px-4 divide-y divide-line mb-4">
            {ops.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-muted">Brak operacji.</div>
            ) : ops.map((o) => <OpRow key={o.id} o={o} meId={user?.id ?? ''} />)}
          </div>

          <SecurityNote />
        </div>
      )}
    </AccountLayout>
  );
}
