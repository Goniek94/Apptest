import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable, Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRealtimeEvent } from '@/shared/realtime/RealtimeContext';
import { useUnread } from '@/features/messages/UnreadContext';
import {
  fetchThread, sendMessage as apiSend, sendImageMessage, type Thread, type Message, type MessageReservation,
} from '@/features/messages/api/messages';
import {
  acceptOffer, rejectOffer, cancelOffer, counterOffer,
} from '@/features/offers/api/offers';
import {
  acceptReservation, rejectReservation, cancelReservation,
} from '@/features/reservations/api/reservations';

const zl = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;
const hm = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

export function ConversationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnread();
  const conversationId: string = route.params?.conversationId;

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [busyOffer, setBusyOffer] = useState<string | null>(null);
  const [counterFor, setCounterFor] = useState<Message | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const t = await fetchThread(conversationId);
      setThread(t);
      refreshUnread(); // wątek oznacza wiadomości jako przeczytane → odśwież badge
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    } catch {
      /* obsługa błędu w UI poniżej */
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Live: nowa wiadomość/zmiana oferty w TEJ rozmowie → cicho przeładuj wątek.
  const onRtMessage = useCallback((payload: { conversationId?: string }) => {
    if (!payload?.conversationId || payload.conversationId === conversationId) load();
  }, [conversationId, load]);
  useRealtimeEvent('message:new', onRtMessage);
  useRealtimeEvent('offer:update', onRtMessage);
  useRealtimeEvent('reservation:update', onRtMessage);

  const other = thread
    ? (user?.id === thread.conversation.buyerId ? thread.conversation.seller : thread.conversation.buyer)
    : null;

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText('');
    try {
      await apiSend(conversationId, body);
      await load();
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const pickAndSend = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setUploading(true);
    try {
      await sendImageMessage(conversationId, { uri: a.uri, name: a.fileName ?? undefined, type: a.mimeType ?? undefined });
      await load();
    } finally {
      setUploading(false);
    }
  };

  const runOffer = async (fn: () => Promise<unknown>, id: string) => {
    setBusyOffer(id);
    try { await fn(); await load(); } finally { setBusyOffer(null); }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;
  }
  if (!thread) {
    return <View style={s.center}><Text style={s.muted}>Nie udało się wczytać rozmowy.</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      {/* Nagłówek */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}><Icon name="arrowLeft" size={22} color={C.ink} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName} numberOfLines={1}>{other?.displayName ?? 'Rozmowa'}</Text>
          {thread.conversation.listing && (
            <Text style={s.headerSub} numberOfLines={1}>{thread.conversation.listing.title}</Text>
          )}
        </View>
        {other?.verified && <Icon name="award" size={18} color={C.gold} />}
      </View>

      {/* Karta przedmiotu */}
      {thread.conversation.listing && (
        <View style={s.listingBar}>
          {thread.conversation.listing.images[0] && (
            <Image source={{ uri: thread.conversation.listing.images[0].url }} style={s.listingImg} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.listingTitle} numberOfLines={1}>{thread.conversation.listing.title}</Text>
            <Text style={s.listingPrice}>{zl(thread.conversation.listing.price)}</Text>
          </View>
        </View>
      )}

      {/* Wątek */}
      <ScrollView ref={scrollRef} style={s.flex} contentContainerStyle={s.thread} showsVerticalScrollIndicator={false}>
        {thread.messages.map((m) => {
          if (m.type === 'SYSTEM') {
            return <Text key={m.id} style={s.system}>{m.body}</Text>;
          }
          if (m.type === 'OFFER' && m.offer) {
            return (
              <OfferCard
                key={m.id}
                message={m}
                meId={user?.id ?? ''}
                busy={busyOffer === m.offer.id}
                onAccept={() => runOffer(() => acceptOffer(m.offer!.id), m.offer!.id)}
                onReject={() => runOffer(() => rejectOffer(m.offer!.id), m.offer!.id)}
                onCancel={() => runOffer(() => cancelOffer(m.offer!.id), m.offer!.id)}
                onCounter={() => setCounterFor(m)}
                onBuy={
                  user?.id === thread.conversation.buyerId && thread.conversation.listing
                    ? () =>
                        navigation.navigate('Platnosc', {
                          item: {
                            id: thread.conversation.listing!.id,
                            title: thread.conversation.listing!.title,
                            price: m.offer!.amount,
                            imageUrl: thread.conversation.listing!.images[0]?.url ?? '',
                          },
                        })
                    : undefined
                }
              />
            );
          }
          if (m.type === 'RESERVATION' && m.reservation) {
            return (
              <ReservationCard
                key={m.id}
                res={m.reservation}
                meId={user?.id ?? ''}
                busy={busyOffer === m.reservation.id}
                onAccept={() => runOffer(() => acceptReservation(m.reservation!.id), m.reservation!.id)}
                onReject={() => runOffer(() => rejectReservation(m.reservation!.id), m.reservation!.id)}
                onCancel={() => runOffer(() => cancelReservation(m.reservation!.id), m.reservation!.id)}
              />
            );
          }
          const mine = m.senderId === user?.id;
          const meta = (
            <View style={[s.metaRow, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
              <Text style={s.metaTime}>{hm(m.createdAt)}</Text>
              {mine && <Text style={[s.tick, m.readAt && { color: C.gold }]}>{m.readAt ? '✓✓' : '✓'}</Text>}
            </View>
          );
          if (m.type === 'IMAGE' && m.imageUrl) {
            return (
              <View key={m.id} style={s.msgBlock}>
                <View style={[s.bubbleRow, mine ? s.rowMine : s.rowOther]}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setViewer(m.imageUrl!)}>
                    <Image source={{ uri: m.imageUrl }} style={s.msgImage} resizeMode="cover" />
                  </TouchableOpacity>
                </View>
                {meta}
              </View>
            );
          }
          return (
            <View key={m.id} style={s.msgBlock}>
              <View style={[s.bubbleRow, mine ? s.rowMine : s.rowOther]}>
                <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
                  <Text style={[s.bubbleText, mine && { color: '#fff' }]}>{m.body}</Text>
                </View>
              </View>
              {meta}
            </View>
          );
        })}
      </ScrollView>

      {/* Pole wpisywania */}
      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={s.attachBtn} onPress={pickAndSend} disabled={uploading} hitSlop={6}>
          {uploading ? <ActivityIndicator color={C.gold} size="small" /> : <Icon name="image" size={22} color={C.gold} />}
        </TouchableOpacity>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Napisz wiadomość…"
          placeholderTextColor={C.muted}
          multiline
        />
        <TouchableOpacity style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} onPress={send} disabled={!text.trim() || sending}>
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ImageGalleryModal images={viewer ? [viewer] : []} visible={!!viewer} initialIndex={0} onClose={() => setViewer(null)} />

      {counterFor && (
        <CounterModal
          listingPrice={thread.conversation.listing?.price ?? 0}
          onClose={() => setCounterFor(null)}
          onSubmit={async (amount, message) => {
            const offerId = counterFor.offer!.id;
            setCounterFor(null);
            await runOffer(() => counterOffer(offerId, { amount, message }), offerId);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Karta oferty (prosta) ───────────────────────────────────────────────────
function OfferCard({ message, meId, busy, onAccept, onReject, onCancel, onCounter, onBuy }: {
  message: Message; meId: string; busy: boolean;
  onAccept: () => void; onReject: () => void; onCancel: () => void; onCounter: () => void; onBuy?: () => void;
}) {
  const o = message.offer!;
  const mine = o.proposedById === meId;
  const isCounter = !!message.body?.toLowerCase().startsWith('kontr');

  let footer: React.ReactNode = null;
  if (o.status === 'PENDING') {
    footer = mine ? (
      <View style={s.offerWaitRow}>
        <Text style={s.offerWaiting}>Oczekuje na odpowiedź</Text>
        <TouchableOpacity onPress={onCancel} disabled={busy} hitSlop={6}><Text style={s.offerCancel}>Wycofaj</Text></TouchableOpacity>
      </View>
    ) : (
      <View style={s.offerActions}>
        <TouchableOpacity style={[s.oBtn, s.oReject]} onPress={onReject} disabled={busy}>
          <Text style={s.oRejectText}>Odrzuć</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.oBtn, s.oAccept]} onPress={onAccept} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.oAcceptText}>Akceptuj</Text>}
        </TouchableOpacity>
      </View>
    );
  } else if (o.status === 'ACCEPTED') {
    footer = (
      <>
        <Text style={[s.offerResult, { color: '#2A7A4A' }]}>✓ Zaakceptowano</Text>
        {onBuy && (
          <TouchableOpacity style={s.buyNowBtn} onPress={onBuy} activeOpacity={0.85}>
            <Icon name="lock" size={13} color="#fff" />
            <Text style={s.buyNowText}>Kup teraz</Text>
          </TouchableOpacity>
        )}
      </>
    );
  } else if (o.status === 'REJECTED') {
    footer = (
      <>
        <Text style={[s.offerResult, { color: '#B23B36' }]}>Odrzucono</Text>
        {!mine && (
          <TouchableOpacity style={s.proposeBtn} onPress={onCounter} disabled={busy}>
            <Text style={s.proposeText}>Zaproponuj swoją cenę</Text>
          </TouchableOpacity>
        )}
      </>
    );
  } else {
    footer = <Text style={[s.offerResult, { color: C.muted }]}>{o.status === 'COUNTERED' ? 'Zastąpiono kontrofertą' : o.status === 'CANCELLED' ? 'Wycofano' : 'Wygasła'}</Text>;
  }

  return (
    <View style={[s.offer, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
      <Text style={s.offerKicker}>{isCounter ? 'KONTROFERTA' : 'OFERTA CENOWA'}</Text>
      <Text style={s.offerAmount}>{zl(o.amount)}</Text>
      {footer}
    </View>
  );
}

// ─── Karta rezerwacji ─────────────────────────────────────────────────────────
function ReservationCard({ res, meId, busy, onAccept, onReject, onCancel }: {
  res: MessageReservation; meId: string; busy: boolean;
  onAccept: () => void; onReject: () => void; onCancel: () => void;
}) {
  const isSeller = res.sellerId === meId;
  const period = res.hours % 24 === 0 ? `${res.hours / 24} ${res.hours / 24 === 1 ? 'dzień' : 'dni'}` : `${res.hours} godz.`;

  let footer: React.ReactNode = null;
  if (res.status === 'PENDING') {
    footer = isSeller ? (
      <View style={s.offerActions}>
        <TouchableOpacity style={[s.oBtn, s.oReject]} onPress={onReject} disabled={busy}><Text style={s.oRejectText}>Odrzuć</Text></TouchableOpacity>
        <TouchableOpacity style={[s.oBtn, s.oAccept]} onPress={onAccept} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.oAcceptText}>Akceptuj</Text>}
        </TouchableOpacity>
      </View>
    ) : (
      <View style={s.offerWaitRow}>
        <Text style={s.offerWaiting}>Oczekuje na decyzję</Text>
        <TouchableOpacity onPress={onCancel} disabled={busy}><Text style={s.offerCancel}>Wycofaj</Text></TouchableOpacity>
      </View>
    );
  } else if (res.status === 'ACCEPTED') {
    const until = res.expiresAt ? new Date(res.expiresAt).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    footer = (
      <>
        <Text style={[s.offerResult, { color: '#2A7A4A' }]}>✓ Zarezerwowane{until ? ` do ${until}` : ''}</Text>
        {!isSeller && <TouchableOpacity style={s.proposeBtn} onPress={onCancel} disabled={busy}><Text style={s.proposeText}>Anuluj rezerwację</Text></TouchableOpacity>}
      </>
    );
  } else {
    const label = res.status === 'REJECTED' ? 'Odrzucono' : res.status === 'CANCELLED' ? 'Anulowano' : 'Wygasła';
    footer = <Text style={[s.offerResult, { color: C.muted }]}>{label}</Text>;
  }

  return (
    <View style={[s.offer, { alignSelf: isSeller ? 'flex-start' : 'flex-end' }]}>
      <View style={s.resHead}><Icon name="clock" size={13} color={C.gold} /><Text style={s.offerKicker}>PROŚBA O REZERWACJĘ</Text></View>
      <Text style={s.offerAmount}>{period}</Text>
      {footer}
    </View>
  );
}

// ─── Modal kontroferty ────────────────────────────────────────────────────────
function CounterModal({ listingPrice, onClose, onSubmit }: {
  listingPrice: number; onClose: () => void; onSubmit: (amount: number, message?: string) => void;
}) {
  const [val, setVal] = useState('');
  const [note, setNote] = useState('');
  const amount = Math.round(parseFloat(val.replace(',', '.')) * 100);
  const valid = Number.isFinite(amount) && amount >= 1 && amount <= listingPrice;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.mOverlay} onPress={onClose}>
        <Pressable style={s.mCard} onPress={() => {}}>
          <Text style={s.mTitle}>Twoja kontrpropozycja</Text>
          <Text style={s.mSub}>Podaj kwotę (maks. {zl(listingPrice)}).</Text>
          <View style={s.mInputRow}>
            <TextInput style={s.mInput} value={val} onChangeText={setVal} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" />
            <Text style={s.mZl}>zł</Text>
          </View>
          <TextInput style={s.mNote} value={note} onChangeText={(t) => setNote(t.slice(0, 300))} placeholder="Wiadomość (opcjonalnie)" placeholderTextColor={C.muted} multiline />
          <TouchableOpacity style={[s.mBtn, !valid && { opacity: 0.5 }]} disabled={!valid} onPress={() => onSubmit(amount, note.trim() || undefined)}>
            <Text style={s.mBtnText}>Wyślij kontrofertę</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}><Text style={s.mCancel}>Anuluj</Text></TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: C.muted, fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  headerName: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  listingBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(242,233,213,0.4)', borderBottomWidth: 1, borderBottomColor: C.line },
  listingImg: { width: 40, height: 48, borderRadius: 8, backgroundColor: C.goldSoft },
  listingTitle: { fontSize: 13, fontWeight: '700', color: C.ink },
  listingPrice: { fontSize: 13, color: C.gold, fontWeight: '700', marginTop: 2 },

  thread: { padding: 16, gap: 12 },
  msgBlock: { width: '100%' },
  system: { alignSelf: 'center', fontSize: 12, color: C.muted, backgroundColor: C.surfaceAlt, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: C.ink, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: C.ink, lineHeight: 19 },
  msgImage: { width: 200, height: 200, borderRadius: 14, backgroundColor: C.goldSoft },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, paddingHorizontal: 4 },
  metaTime: { fontSize: 10, color: C.muted },
  tick: { fontSize: 10, color: C.muted, fontWeight: '700' },

  offer: { minWidth: 210, maxWidth: '82%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: C.gold, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  offerKicker: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 0.6 },
  resHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offerAmount: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginTop: 2 },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  oBtn: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  oReject: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  oRejectText: { fontSize: 13, fontWeight: '700', color: '#B23B36' },
  oAccept: { backgroundColor: C.gold },
  oAcceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  offerWaitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  offerWaiting: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
  offerCancel: { fontSize: 13, fontWeight: '700', color: '#B23B36' },
  offerResult: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  proposeBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: C.goldSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  proposeText: { fontSize: 13, fontWeight: '700', color: C.gold },
  buyNowBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.ink, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  buyNowText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line },
  attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.goldSoft },
  input: { flex: 1, maxHeight: 120, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },

  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  mCard: { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 22 },
  mTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center' },
  mSub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  mInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
  mInput: { flex: 1, paddingVertical: 13, fontSize: 18, fontWeight: '700', color: C.ink },
  mZl: { fontSize: 15, color: C.muted, fontWeight: '700' },
  mNote: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.ink, marginTop: 10, minHeight: 60, textAlignVertical: 'top' },
  mBtn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  mBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mCancel: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center' },
});
