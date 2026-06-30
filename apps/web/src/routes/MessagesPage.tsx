'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { grosze } from '@modamarket/shared';
import { Icon } from '../components/ui/Icon';
import { Avatar } from '../components/ui';
import { useCurrentUser, openAuth } from '../lib/auth';
import { useRealtimeEvent } from '../lib/realtime';
import {
  fetchConversations, fetchThread, sendMessage, sendImageMessage,
  markConversationRead, deleteConversation,
  type Conversation, type Thread, type Message, type ConvUser,
} from '../lib/api/messages';
import { acceptOffer, rejectOffer, cancelOffer } from '../lib/api/offers';
import { acceptReservation, rejectReservation, cancelReservation } from '../lib/api/reservations';

const time = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const dayOrTime = (iso: string) => {
  const d = new Date(iso); const now = new Date();
  if (d.toDateString() === now.toDateString()) return time(iso);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
};

/* ---------- Karta oferty w czacie ---------- */
function OfferCard({ m, meId, onChanged }: { m: Message; meId: string; onChanged: () => void }) {
  const o = m.offer!;
  const iAmRecipient = o.proposedById !== meId;
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); onChanged(); } finally { setBusy(false); } };
  return (
    <div className="card-surface p-3 max-w-[78%] w-full">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gold mb-1">Oferta cenowa</div>
      <div className="font-serif text-xl font-bold text-ink">{grosze(o.amount)}</div>
      {o.status === 'PENDING' && iAmRecipient ? (
        <div className="flex gap-2 mt-2">
          <button disabled={busy} onClick={() => act(() => rejectOffer(o.id))} className="flex-1 py-2 rounded-pill border border-line text-[13px] font-semibold text-ink-soft disabled:opacity-50">Odrzuć</button>
          <button disabled={busy} onClick={() => act(() => acceptOffer(o.id))} className="flex-1 py-2 rounded-pill btn-gold text-white text-[13px] font-semibold disabled:opacity-50">Akceptuj</button>
        </div>
      ) : o.status === 'PENDING' ? (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-muted">Oczekuje na odpowiedź</span>
          <button disabled={busy} onClick={() => act(() => cancelOffer(o.id))} className="text-[12px] font-semibold text-danger">Wycofaj</button>
        </div>
      ) : (
        <div className="text-[12px] font-semibold mt-1.5" style={{ color: o.status === 'ACCEPTED' ? '#2A7A4A' : '#B23B36' }}>
          {o.status === 'ACCEPTED' ? '✓ Zaakceptowano' : o.status === 'REJECTED' ? 'Odrzucono' : o.status === 'CANCELLED' ? 'Wycofano' : 'Wygasła'}
        </div>
      )}
    </div>
  );
}

/* ---------- Karta rezerwacji w czacie ---------- */
function ReservationCard({ m, meId, onChanged }: { m: Message; meId: string; onChanged: () => void }) {
  const r = m.reservation!;
  const isSeller = r.sellerId === meId;
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); onChanged(); } finally { setBusy(false); } };
  const days = r.hours >= 24 ? `${Math.round(r.hours / 24)} dni` : `${r.hours} h`;
  return (
    <div className="card-surface p-3 max-w-[78%] w-full">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gold mb-1">Prośba o rezerwację · {days}</div>
      {r.status === 'PENDING' && isSeller ? (
        <div className="flex gap-2 mt-2">
          <button disabled={busy} onClick={() => act(() => rejectReservation(r.id))} className="flex-1 py-2 rounded-pill border border-line text-[13px] font-semibold text-ink-soft disabled:opacity-50">Odrzuć</button>
          <button disabled={busy} onClick={() => act(() => acceptReservation(r.id))} className="flex-1 py-2 rounded-pill btn-gold text-white text-[13px] font-semibold disabled:opacity-50">Akceptuj</button>
        </div>
      ) : r.status === 'PENDING' ? (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-muted">Oczekuje na akceptację</span>
          <button disabled={busy} onClick={() => act(() => cancelReservation(r.id))} className="text-[12px] font-semibold text-danger">Wycofaj</button>
        </div>
      ) : r.status === 'ACCEPTED' ? (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[12px] font-semibold text-[#2A7A4A]">✓ Zarezerwowane{r.expiresAt ? ` do ${new Date(r.expiresAt).toLocaleDateString('pl-PL')}` : ''}</span>
          {!isSeller && <button disabled={busy} onClick={() => act(() => cancelReservation(r.id))} className="text-[12px] font-semibold text-danger">Anuluj</button>}
        </div>
      ) : (
        <div className="text-[12px] font-semibold mt-1.5 text-[#B23B36]">
          {r.status === 'REJECTED' ? 'Odrzucono' : r.status === 'CANCELLED' ? 'Wycofano' : 'Wygasła'}
        </div>
      )}
    </div>
  );
}

/* ---------- Panel rozmowy ---------- */
function Chat({ thread, meId, onBack, onChanged, compact }: { thread: Thread; meId: string; onBack?: () => void; onChanged: () => void; compact?: boolean }) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conv = thread.conversation;
  const peer: ConvUser = conv.buyerId === meId ? conv.seller : conv.buyer;

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [thread.messages.length]);

  const send = async () => {
    const body = text.trim(); if (!body) return;
    setText('');
    try { await sendMessage(conv.id, body); onChanged(); } catch {}
  };
  const pickImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { await sendImageMessage(conv.id, f); onChanged(); } catch {}
  };

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100dvh-128px)]'}`}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImg} />
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line">
        {onBack && <button onClick={onBack}><Icon name="arrowLeft" size={20} /></button>}
        <Avatar name={peer.displayName} src={peer.avatarUrl ?? undefined} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink leading-tight">{peer.displayName}</div>
          <div className="text-[11px] text-muted">{peer.accountType === 'BUSINESS' ? 'Firma' : 'Użytkownik'}</div>
        </div>
      </div>

      {conv.listing && (
        <div className="m-3 card-surface p-2.5 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${conv.listing.images?.[0]?.url ?? ''}')` }} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink truncate">{conv.listing.title}</div>
            <div className="text-[14px] font-bold text-ink">{grosze(conv.listing.price)}</div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
        {thread.messages.map((m) => {
          const fromMe = m.senderId === meId;
          if (m.type === 'OFFER' && m.offer) return <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}><OfferCard m={m} meId={meId} onChanged={onChanged} /></div>;
          if (m.type === 'RESERVATION' && m.reservation) return <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}><ReservationCard m={m} meId={meId} onChanged={onChanged} /></div>;
          return (
            <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] flex flex-col ${fromMe ? 'items-end' : 'items-start'}`}>
                {m.type === 'IMAGE' && m.imageUrl ? (
                  <img src={m.imageUrl} alt="" className="w-40 rounded-lg object-cover" />
                ) : (
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${fromMe ? 'bg-gold-soft text-ink rounded-br-md' : 'bg-surface border border-line rounded-bl-md'}`}>{m.body}</div>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted px-1">
                  {time(m.createdAt)}
                  {fromMe && <Icon name="check" size={11} className={m.readAt ? 'text-gold' : 'text-muted'} />}
                </div>
              </div>
            </div>
          );
        })}
        {thread.messages.length === 0 && <div className="text-center text-[12px] text-muted py-8">Brak wiadomości — napisz pierwszy.</div>}
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-line">
        <button onClick={() => fileRef.current?.click()} className="text-muted"><Icon name="paperclip" size={20} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 bg-surface border border-line rounded-pill px-4 py-2.5 text-sm outline-none placeholder:text-muted" placeholder="Napisz wiadomość..." />
        <button onClick={send} className="btn-gold w-10 h-10 rounded-pill text-white shrink-0"><Icon name="send" size={18} /></button>
      </div>
    </div>
  );
}

function ConvoRow({ c, meId, active, onOpen, onDelete }: { c: Conversation; meId: string; active?: boolean; onOpen: () => void; onDelete: () => void }) {
  const peer = c.buyerId === meId ? c.seller : c.buyer;
  const last = c.lastMessage;
  const preview = last ? (last.type === 'IMAGE' ? '📷 Zdjęcie' : last.type === 'OFFER' ? '💰 Oferta cenowa' : last.type === 'RESERVATION' ? '⏳ Rezerwacja' : last.body) : 'Rozpocznij rozmowę';
  return (
    <div role="button" onClick={onOpen} className={`w-full flex items-center gap-3.5 py-4 px-2 text-left cursor-pointer rounded-lg ${active ? 'bg-gold-soft/40' : ''}`}>
      <Avatar name={peer.displayName} src={peer.avatarUrl ?? undefined} size={52} />
      {c.listing && <div className="w-14 h-14 rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${c.listing.images?.[0]?.url ?? ''}')` }} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15.5px] font-semibold text-ink truncate">{peer.displayName}</span>
          <span className="text-[12px] text-muted shrink-0">{dayOrTime(c.updatedAt)}</span>
        </div>
        {c.listing && <div className="text-[13px] text-ink-soft truncate mt-0.5">{c.listing.title}</div>}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[13px] text-muted truncate">{preview}</span>
          {c.unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-pill bg-gold text-white text-[11px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Usuń rozmowę" className="ml-1 w-8 h-8 rounded-pill flex items-center justify-center text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

export function MessagesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, hydrated } = useCurrentUser();
  const meId = user?.id ?? '';
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [openId, setOpenId] = useState<string | null>(params.get('c'));
  const [thread, setThread] = useState<Thread | null>(null);

  const loadConvos = useCallback(() => { fetchConversations().then(setConvos).catch(() => {}); }, []);
  useEffect(() => { if (user) loadConvos(); }, [user, loadConvos]);

  const loadThread = useCallback((id: string) => { fetchThread(id).then(setThread).catch(() => {}); }, []);
  useEffect(() => {
    if (!openId) { setThread(null); return; }
    loadThread(openId);
    markConversationRead(openId).then(loadConvos).catch(() => {});
  }, [openId, loadThread, loadConvos]);

  const onRt = useCallback(() => {
    loadConvos();
    if (openId) loadThread(openId);
  }, [openId, loadConvos, loadThread]);
  useRealtimeEvent('message:new', onRt);
  useRealtimeEvent('conversation:update', onRt);
  useRealtimeEvent('offer:update', onRt);
  useRealtimeEvent('reservation:update', onRt);

  const onChanged = useCallback(() => { if (openId) loadThread(openId); loadConvos(); }, [openId, loadThread, loadConvos]);
  const remove = async (id: string) => {
    setConvos((cs) => cs.filter((c) => c.id !== id));
    if (openId === id) setOpenId(null);
    try { await deleteConversation(id); } catch { loadConvos(); }
  };

  if (hydrated && !user) {
    return <div className="text-center py-20 text-muted text-sm">Zaloguj się, aby zobaczyć wiadomości.<button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button></div>;
  }

  const list = (
    <div className="divide-y divide-line">
      {convos.length === 0 ? (
        <div className="py-12 text-center text-muted text-sm">Brak rozmów.</div>
      ) : convos.map((c) => (
        <ConvoRow key={c.id} c={c} meId={meId} active={openId === c.id} onOpen={() => setOpenId(c.id)} onDelete={() => remove(c.id)} />
      ))}
    </div>
  );

  return (
    <div>
      {/* MOBILE */}
      <div className="md:hidden">
        {openId && thread ? (
          <Chat thread={thread} meId={meId} onBack={() => setOpenId(null)} onChanged={onChanged} />
        ) : (
          <div className="px-4 pt-3">
            <h1 className="font-serif text-2xl font-semibold text-ink mb-4">Wiadomości</h1>
            {list}
          </div>
        )}
      </div>

      {/* DESKTOP (2-pane) */}
      <div className="hidden md:block w-full max-w-[1760px] mx-auto px-4 md:px-8 py-6">
        <h1 className="font-serif text-2xl font-semibold text-ink mb-4">Wiadomości</h1>
        <div className="grid grid-cols-[360px_1fr] gap-6 h-[calc(100vh-240px)]">
          <div className="card-surface flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3">{list}</div>
          </div>
          <div className="card-surface overflow-hidden">
            {openId && thread ? (
              <Chat thread={thread} meId={meId} onChanged={onChanged} compact />
            ) : (
              <div className="h-full flex items-center justify-center text-muted text-sm">Wybierz rozmowę z listy.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
