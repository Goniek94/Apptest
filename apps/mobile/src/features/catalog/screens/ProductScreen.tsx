import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { grosze, conditionLabel } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Avatar } from '@/shared/ui';
import { ImageCarousel } from '@/shared/components/ImageCarousel';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { fetchListing, type ApiListing } from '@/features/catalog/api/listings';
import { addFavorite, removeFavorite } from '@/features/favorites/api/favorites';
import { useAuth } from '@/features/auth/context/AuthContext';
import { startConversation } from '@/features/messages/api/messages';
import { createOffer } from '@/features/offers/api/offers';
import { createReservation, RESERVATION_PERIODS } from '@/features/reservations/api/reservations';

const zlFmt = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;

const TRUST: { icon: IconName; label: string }[] = [
  { icon: 'shield', label: 'Ochrona kupującego' },
  { icon: 'truck', label: 'Śledzona przesyłka' },
  { icon: 'box', label: 'Zwroty 14 dni' },
];

/** Szczegóły produktu — wierny port mobilnego widoku z weba (galeria, detale, sprzedawca, zaufanie). */
export function ProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const id = route.params?.id as string | undefined;

  const [p, setP] = useState<ApiListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [fav, setFav] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { user } = useAuth();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerVal, setOfferVal] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerDone, setOfferDone] = useState(false);

  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveHours, setReserveHours] = useState(48);
  const [reserveNote, setReserveNote] = useState('');
  const [reserveBusy, setReserveBusy] = useState(false);
  const [reserveDone, setReserveDone] = useState(false);

  const canNegotiate = !!p && p.negotiable !== false && (!user || p.sellerId !== user.id);
  const canReserve = !!p && p.status === 'ACTIVE' && (!user || p.sellerId !== user.id);
  const isOwner = !!p && !!user && p.sellerId === user.id;
  const canBuy = !!p && p.status === 'ACTIVE' && !isOwner;

  // „Kup teraz": nie pozwalamy kupić własnego ogłoszenia ani nieaktywnego; gość → logowanie.
  const onBuy = () => {
    if (!user) return navigation.navigate('Auth');
    if (!p) return;
    navigation.navigate('Platnosc', {
      item: { id: p.id, title: p.title, price: p.price, imageUrl: p.images[0]?.url ?? '', size: p.size ?? undefined, color: p.color ?? undefined },
    });
  };

  const submitReserve = async () => {
    if (!user) return navigation.navigate('Auth');
    if (!p) return;
    setReserveBusy(true);
    try {
      await createReservation({ listingId: p.id, hours: reserveHours, message: reserveNote.trim() || undefined });
      setReserveDone(true);
    } catch {
      // błąd zostaje w modalu
    } finally {
      setReserveBusy(false);
    }
  };

  const openWrite = async () => {
    if (!user) return navigation.navigate('Auth');
    if (!p) return;
    try {
      const { id: convId } = await startConversation(p.id);
      navigation.navigate('Rozmowa', { conversationId: convId });
    } catch {
      navigation.navigate('Wiadomości');
    }
  };

  const submitOffer = async () => {
    if (!user) return navigation.navigate('Auth');
    if (!p) return;
    const amount = Math.round(parseFloat(offerVal.replace(',', '.')) * 100);
    if (!Number.isFinite(amount) || amount < 1 || amount >= p.price) return;
    setOfferBusy(true);
    try {
      await createOffer({ listingId: p.id, amount, message: offerNote.trim() || undefined });
      setOfferDone(true);
    } catch {
      // błąd zostaje w modalu — użytkownik może spróbować ponownie
    } finally {
      setOfferBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { raw } = await fetchListing(id);
        if (!cancelled) setP(raw);
      } catch {
        /* komunikat poniżej */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const toggleFav = async () => {
    if (!p) return;
    const next = !fav;
    setFav(next);
    try {
      next ? await addFavorite(p.id) : await removeFavorite(p.id);
    } catch {
      setFav(!next);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;
  if (!p) return <View style={s.center}><Text style={s.notFound}>Nie znaleziono ogłoszenia.</Text></View>;

  const gallery = p.images.map((i) => i.url);
  const cover = gallery[active] ?? gallery[0];
  const seller = p.seller;
  const subtitle = `${conditionLabel(p.condition)} · ${p.size ? `Rozmiar ${p.size}` : 'Uniwersalny'}${p.color ? ` · ${p.color}` : ''}`;

  const details: { icon: IconName; label: string; value: string }[] = [
    { icon: 'shield', label: 'Stan', value: conditionLabel(p.condition) },
    { icon: 'hanger', label: 'Rozmiar', value: p.size ?? 'Uniwersalny' },
    { icon: 'tag', label: 'Kolor', value: p.color ?? '—' },
    { icon: 'bag', label: 'Kategoria', value: p.category?.name ?? '—' },
    { icon: 'crown', label: 'Marka', value: p.brand ?? '—' },
    ...(p.quantity > 1 ? [{ icon: 'box' as IconName, label: 'Dostępne', value: `${p.quantity} szt.` }] : []),
    ...(p.unisex ? [{ icon: 'users' as IconName, label: 'Rodzaj', value: 'Unisex' }] : []),
    ...(p.material ? [{ icon: 'refresh' as IconName, label: 'Materiał', value: p.material }] : []),
    ...(p.widthCm ? [{ icon: 'sliders' as IconName, label: 'Szerokość', value: `${p.widthCm} cm` }] : []),
    ...(p.lengthCm ? [{ icon: 'hanger' as IconName, label: 'Długość', value: `${p.lengthCm} cm` }] : []),
  ];

  const description =
    p.description ??
    `Klasyczny produkt ${p.brand ?? ''} w ponadczasowej kolorystyce. Wygodny, lekki i idealny na co dzień. Wysokiej jakości materiały zapewniają trwałość i komfort. Oryginalny, sprawdzony przez moderację AdBox.`;
  const longDesc = description.length > 140;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Górny panel — strzałka powrotu + ulubione */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.circleBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={18} color={C.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={s.circleBtn} onPress={toggleFav}>
          <Icon name="heart" size={18} color={fav ? '#B23B36' : C.ink} fill={fav ? '#B23B36' : 'none'} />
        </TouchableOpacity>
      </View>

      {/* Zdjęcie główne — karuzela (swipe), klik = pełny ekran; licznik zdjęć */}
      <View style={s.hero}>
        {gallery.length > 0 ? (
          <ImageCarousel images={gallery} active={active} onActiveChange={setActive} onPress={() => setGalleryOpen(true)} />
        ) : null}
        {gallery.length > 1 && (
          <View style={s.countPill}>
            <Icon name="image" size={12} color="#fff" />
            <Text style={s.countText}>{active + 1} / {gallery.length}</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        {/* Nagłówek — wyróżniony blok z marką, tytułem i ceną */}
        <View style={s.headerBlock}>
          {p.brand ? <Text style={s.brand}>{p.brand}</Text> : null}
          <Text style={s.title}>{p.title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
          <View style={s.accent} />
          <Text style={s.price}>{grosze(p.price)}</Text>
        </View>

        {/* Detale */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Detale</Text>
          <View style={s.detailsGrid}>
            {details.map((d) => (
              <View key={d.label} style={s.detailTile}>
                <Icon name={d.icon} size={17} color={C.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={s.detailLabel}>{d.label}</Text>
                  <Text style={s.detailValue} numberOfLines={1}>{d.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Opis — w karcie, z wyznaczonym miejscem */}
        <View style={[s.card, { marginTop: 16 }]}>
          <Text style={s.cardTitle}>Opis</Text>
          <Text style={s.desc} numberOfLines={!longDesc || expanded ? undefined : 4}>{description}</Text>
          {longDesc && (
            <TouchableOpacity style={s.more} onPress={() => setExpanded((e) => !e)}>
              <Text style={s.moreText}>{expanded ? 'Pokaż mniej' : 'Pokaż więcej'}</Text>
              <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} color={C.gold} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sprzedawca */}
        {seller && (
          <View style={s.seller}>
            <Avatar name={seller.displayName} src={seller.avatarUrl ?? undefined} size={48} />
            <View style={{ flex: 1 }}>
              <View style={s.sellerNameRow}>
                <Text style={s.sellerName}>{seller.displayName}</Text>
                {seller.accountType === 'BUSINESS' && (
                  <View style={s.bizBadge}><Icon name="award" size={10} color={C.gold} /><Text style={s.bizBadgeText}>Firma</Text></View>
                )}
              </View>
              <View style={s.sellerRow}>
                <Icon name="star" size={12} color={C.gold} fill={C.gold} />
                <Text style={s.sellerMuted}>{(seller.ratingAvg ?? 0).toFixed(1)} · {seller.ratingCount ?? 0} opinie</Text>
              </View>
              <View style={s.sellerRow}>
                <Icon name="shield" size={12} color={C.gold} />
                <Text style={s.sellerVerified}>Zweryfikowany sprzedawca</Text>
              </View>
            </View>
            <TouchableOpacity style={s.writeBtn} onPress={openWrite} activeOpacity={0.85}>
              <Icon name="chat" size={15} color={C.ink} />
              <Text style={s.writeText}>Napisz</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Zaufanie */}
        <View style={s.trust}>
          {TRUST.map((t) => (
            <View key={t.label} style={s.trustItem}>
              <Icon name={t.icon} size={18} color={C.gold} />
              <Text style={s.trustText}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>

    {/* Sticky CTA — nie zajmuje miejsca w treści */}
    <View style={[s.ctaBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {(canNegotiate || canReserve) && (
        <View style={s.secondaryRow}>
          {canNegotiate && (
            <TouchableOpacity style={[s.offerBtn, { flex: 1 }]} activeOpacity={0.85} onPress={() => { setOfferDone(false); setOfferVal(''); setOfferNote(''); setOfferOpen(true); }}>
              <Icon name="tag" size={16} color={C.gold} />
              <Text style={s.offerBtnText}>Złóż ofertę</Text>
            </TouchableOpacity>
          )}
          {canReserve && (
            <TouchableOpacity style={[s.offerBtn, { flex: 1 }]} activeOpacity={0.85} onPress={() => { if (!user) return navigation.navigate('Auth'); setReserveDone(false); setReserveNote(''); setReserveOpen(true); }}>
              <Icon name="clock" size={16} color={C.gold} />
              <Text style={s.offerBtnText}>Zarezerwuj</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={s.ctaRow}>
        {canBuy ? (
          <TouchableOpacity style={s.buyBtn} activeOpacity={0.85} onPress={onBuy}>
            <Text style={s.buyText}>Kup teraz</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.buyBtn, s.buyDisabled]}>
            <Text style={[s.buyText, s.buyDisabledText]}>
              {isOwner ? 'To Twoje ogłoszenie' : p.status === 'SOLD' ? 'Sprzedane' : 'Niedostępne'}
            </Text>
          </View>
        )}
        {p.groupBuy && !isOwner && (
          <TouchableOpacity style={s.groupBtn} activeOpacity={0.85} onPress={() => navigation.navigate('KupWGrupie')}>
            <Icon name="users" size={17} color={C.gold} />
            <Text style={s.groupText}>Kup w grupie</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* Modal: złóż ofertę */}
    <Modal visible={offerOpen} transparent animationType="fade" onRequestClose={() => setOfferOpen(false)}>
      <Pressable style={s.ofOverlay} onPress={() => setOfferOpen(false)}>
        <Pressable style={s.ofCard} onPress={() => {}}>
          {offerDone ? (
            <>
              <View style={s.ofIcon}><Icon name="check" size={26} color="#2A7A4A" /></View>
              <Text style={s.ofTitle}>Oferta wysłana</Text>
              <Text style={s.ofSub}>Sprzedający dostał Twoją ofertę w wiadomości. Odpowiedź zobaczysz w czacie.</Text>
              <TouchableOpacity style={s.ofBtn} onPress={() => setOfferOpen(false)}><Text style={s.ofBtnText}>Rozumiem</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.ofTitle}>Twoja propozycja ceny</Text>
              <Text style={s.ofSub}>Cena ogłoszenia: {p ? zlFmt(p.price) : ''}. Oferta musi być niższa.</Text>
              <View style={s.ofInputRow}>
                <TextInput style={s.ofInput} value={offerVal} onChangeText={setOfferVal} placeholder="0" placeholderTextColor={C.muted} keyboardType="numeric" />
                <Text style={s.ofZl}>zł</Text>
              </View>
              <TextInput style={s.ofNote} value={offerNote} onChangeText={(t) => setOfferNote(t.slice(0, 300))} placeholder="Wiadomość do sprzedającego (opcjonalnie)" placeholderTextColor={C.muted} multiline />
              <TouchableOpacity style={[s.ofBtn, offerBusy && { opacity: 0.6 }]} onPress={submitOffer} disabled={offerBusy}>
                {offerBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.ofBtnText}>Wyślij ofertę</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOfferOpen(false)} style={{ marginTop: 10 }}><Text style={s.ofCancel}>Anuluj</Text></TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>

    {/* Modal: zarezerwuj */}
    <Modal visible={reserveOpen} transparent animationType="fade" onRequestClose={() => setReserveOpen(false)}>
      <Pressable style={s.ofOverlay} onPress={() => setReserveOpen(false)}>
        <Pressable style={s.ofCard} onPress={() => {}}>
          {reserveDone ? (
            <>
              <View style={s.ofIcon}><Icon name="check" size={26} color="#2A7A4A" /></View>
              <Text style={s.ofTitle}>Prośba wysłana</Text>
              <Text style={s.ofSub}>Sprzedający zaakceptuje lub odrzuci rezerwację. Decyzję zobaczysz w czacie.</Text>
              <TouchableOpacity style={s.ofBtn} onPress={() => setReserveOpen(false)}><Text style={s.ofBtnText}>Rozumiem</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.ofTitle}>Zarezerwuj przedmiot</Text>
              <Text style={s.ofSub}>Wybierz, na jak długo chcesz zarezerwować. Sprzedający musi potwierdzić.</Text>
              <View style={s.periodWrap}>
                {RESERVATION_PERIODS.map((p2) => {
                  const on = reserveHours === p2.hours;
                  return (
                    <TouchableOpacity key={p2.hours} style={[s.periodChip, on && s.periodChipOn]} onPress={() => setReserveHours(p2.hours)} activeOpacity={0.8}>
                      <Text style={[s.periodText, on && s.periodTextOn]}>{p2.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput style={s.ofNote} value={reserveNote} onChangeText={(t) => setReserveNote(t.slice(0, 300))} placeholder="Wiadomość do sprzedającego (opcjonalnie)" placeholderTextColor={C.muted} multiline />
              <TouchableOpacity style={[s.ofBtn, reserveBusy && { opacity: 0.6 }]} onPress={submitReserve} disabled={reserveBusy}>
                {reserveBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.ofBtnText}>Wyślij prośbę o rezerwację</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReserveOpen(false)} style={{ marginTop: 10 }}><Text style={s.ofCancel}>Anuluj</Text></TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>

    <ImageGalleryModal images={gallery} visible={galleryOpen} initialIndex={active} onClose={() => setGalleryOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: C.muted, fontSize: 15 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.line },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  hero: { aspectRatio: 4 / 3, backgroundColor: C.goldSoft },
  countPill: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(30,27,22,0.7)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },


  body: { paddingHorizontal: 16, paddingTop: 4 },
  headerBlock: { alignItems: 'center', paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: C.line },
  brand: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.gold, fontWeight: '700', marginBottom: 10 },
  title: { fontFamily: SERIF, fontSize: 27, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 34 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 8 },
  accent: { width: 44, height: 2, borderRadius: 2, backgroundColor: C.gold, marginTop: 18, marginBottom: 16 },
  price: { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: C.ink },

  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, gap: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 16, paddingTop: 12 },
  ctaRow: { flexDirection: 'row', gap: 12 },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  offerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.goldSoft, borderRadius: 999, paddingVertical: 11 },
  offerBtnText: { fontSize: 14, fontWeight: '700', color: C.gold },
  periodWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch', marginBottom: 6 },
  periodChip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: C.surface },
  periodChipOn: { backgroundColor: C.gold, borderColor: C.gold },
  periodText: { fontSize: 13, fontWeight: '700', color: C.inkSoft },
  periodTextOn: { color: '#fff' },

  ofOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  ofCard: { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 22, alignItems: 'center' },
  ofIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(42,122,74,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ofTitle: { fontFamily: SERIF, fontSize: 21, fontWeight: '700', color: C.ink, textAlign: 'center' },
  ofSub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  ofInputRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
  ofInput: { flex: 1, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: C.ink },
  ofZl: { fontSize: 15, color: C.muted, fontWeight: '700' },
  ofNote: { alignSelf: 'stretch', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.ink, marginTop: 10, minHeight: 60, textAlignVertical: 'top' },
  ofBtn: { alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  ofBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ofCancel: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center' },
  buyBtn: { flex: 1, backgroundColor: C.ink, borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
  buyText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  buyDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  buyDisabledText: { color: C.muted },
  groupBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.gold, borderRadius: 999, paddingVertical: 11 },
  groupText: { color: C.ink, fontSize: 14, fontWeight: '700' },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, marginTop: 24 },
  cardTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailTile: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  detailLabel: { fontSize: 11, color: C.muted },
  detailValue: { fontSize: 13, fontWeight: '700', color: C.ink },

  desc: { fontSize: 14, color: C.inkSoft, lineHeight: 21 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  moreText: { fontSize: 13, fontWeight: '700', color: C.gold },

  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginTop: 24 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellerName: { fontSize: 15, fontWeight: '700', color: C.ink },
  bizBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.goldSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  bizBadgeText: { fontSize: 10, fontWeight: '800', color: C.gold },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sellerMuted: { fontSize: 12, color: C.muted },
  sellerVerified: { fontSize: 12, color: C.gold, fontWeight: '600' },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  writeText: { fontSize: 13, fontWeight: '700', color: C.ink },

  trust: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, marginTop: 24, paddingTop: 16 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: C.muted, textAlign: 'center' },
});
