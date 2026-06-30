import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { grosze, conditionLabel } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';
import { ImageCarousel } from '@/shared/components/ImageCarousel';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { createListing, uploadListingImage } from '@/features/catalog/api/listings';
import type { ApiError } from '@/shared/api/client';
import type { SellPreviewParams } from '@/features/selling/types';

const TRUST: { icon: IconName; label: string }[] = [
  { icon: 'shield', label: 'Ochrona kupującego' },
  { icon: 'truck', label: 'Śledzona przesyłka' },
  { icon: 'box', label: 'Zwroty 14 dni' },
];

/** Podgląd ogłoszenia przed publikacją — pełny układ szczegółów (jak finalna oferta). */
export function ListingPreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { draft, photos } = route.params as SellPreviewParams;

  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const gallery = photos.map((p) => p.uri);
  const cover = gallery[active] ?? gallery[0];
  const colorLabel = draft.colors.join(', ');
  const subName = draft.categoryLabel.split('›').pop()?.trim() ?? draft.categoryLabel;
  const subtitle = `${conditionLabel(draft.condition)} · ${draft.size ? `Rozmiar ${draft.size}` : 'Uniwersalny'}${colorLabel ? ` · ${colorLabel}` : ''}`;

  const details: { icon: IconName; label: string; value: string }[] = [
    { icon: 'shield', label: 'Stan', value: conditionLabel(draft.condition) },
    { icon: 'hanger', label: 'Rozmiar', value: draft.size ?? 'Uniwersalny' },
    { icon: 'tag', label: 'Kolor', value: colorLabel || '—' },
    { icon: 'bag', label: 'Kategoria', value: subName },
    { icon: 'crown', label: 'Marka', value: draft.brand ?? '—' },
    { icon: 'refresh', label: 'Materiał', value: 'Tekstylia' },
    ...(draft.widthCm ? [{ icon: 'sliders' as IconName, label: 'Szerokość', value: `${draft.widthCm} cm` }] : []),
    ...(draft.lengthCm ? [{ icon: 'hanger' as IconName, label: 'Długość', value: `${draft.lengthCm} cm` }] : []),
  ];

  const description =
    draft.description ??
    `Produkt ${draft.brand ?? ''} w ponadczasowej kolorystyce. Oryginalny, sprawdzony przez moderację AdBox.`;
  const longDesc = description.length > 140;

  const publish = async () => {
    setSubmitting(true);
    try {
      const created = await createListing({
        title: draft.title,
        description: draft.description,
        price: draft.price,
        brand: draft.brand,
        size: draft.size,
        material: draft.material,
        color: colorLabel || undefined,
        widthCm: draft.widthCm,
        lengthCm: draft.lengthCm,
        condition: draft.condition,
        negotiable: draft.negotiable,
        unisex: draft.unisex,
        quantity: draft.quantity,
        groupBuy: draft.groupBuy,
        categoryId: draft.categoryId,
      });
      let photoError = false;
      for (const ph of photos) {
        try { await uploadListingImage(created.id, ph); } catch { photoError = true; }
      }
      navigation.navigate('OgloszenieOpublikowane', { id: created.id, photoError });
    } catch (e) {
      const err = e as ApiError;
      const reason = err?.status
        ? err.message
        : 'Brak połączenia z serwerem. Upewnij się, że backend działa i telefon jest w tej samej sieci.';
      Alert.alert('Nie udało się opublikować', reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Górny panel — powrót + plakietka „Podgląd" */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.circleBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={18} color={C.ink} />
        </TouchableOpacity>
        <View style={s.previewTag}><Icon name="eye" size={12} color="#fff" /><Text style={s.previewTagText}>Podgląd</Text></View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Zdjęcie główne — karuzela (swipe), klik = pełny ekran; licznik zdjęć */}
        <View style={s.hero}>
          {gallery.length > 0 ? (
            <ImageCarousel images={gallery} active={active} onActiveChange={setActive} onPress={() => setGalleryOpen(true)} />
          ) : (
            <View style={s.heroEmpty}><Icon name="image" size={40} color={C.muted} /><Text style={s.heroEmptyText}>Brak zdjęć</Text></View>
          )}
          {gallery.length > 1 && (
            <View style={s.countPill}>
              <Icon name="image" size={12} color="#fff" />
              <Text style={s.countText}>{active + 1} / {gallery.length}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          {/* Nagłówek — wyróżniony blok */}
          <View style={s.headerBlock}>
            <Text style={s.category}>{draft.categoryLabel}</Text>
            {draft.brand ? <Text style={s.brand}>{draft.brand}</Text> : null}
            <Text style={s.title}>{draft.title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
            <View style={s.accent} />
            <Text style={s.price}>{grosze(draft.price)}</Text>
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

      {/* Pasek akcji */}
      <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Button title="Wróć do edycji" variant="ghost" full onPress={() => navigation.goBack()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Opublikuj" full loading={submitting} onPress={publish} />
        </View>
      </View>

      <ImageGalleryModal images={gallery} visible={galleryOpen} initialIndex={active} onClose={() => setGalleryOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.line },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  hero: { aspectRatio: 4 / 3, backgroundColor: C.goldSoft },
  heroEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroEmptyText: { color: C.muted, fontSize: 13 },
  previewTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(30,27,22,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  previewTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  countPill: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(30,27,22,0.7)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  body: { paddingHorizontal: 16, paddingTop: 4 },
  headerBlock: { alignItems: 'center', paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: C.line },
  category: { fontSize: 12, color: C.muted, marginBottom: 8 },
  brand: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.gold, fontWeight: '700', marginBottom: 10 },
  title: { fontFamily: SERIF, fontSize: 27, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 34 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 8 },
  accent: { width: 44, height: 2, borderRadius: 2, backgroundColor: C.gold, marginTop: 18, marginBottom: 16 },
  price: { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: C.ink },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, marginTop: 24 },
  cardTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailTile: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  detailLabel: { fontSize: 11, color: C.muted },
  detailValue: { fontSize: 13, fontWeight: '700', color: C.ink },

  desc: { fontSize: 14, color: C.inkSoft, lineHeight: 21 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  moreText: { fontSize: 13, fontWeight: '700', color: C.gold },

  trust: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, marginTop: 24, paddingTop: 16 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: C.muted, textAlign: 'center' },

  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 16, paddingTop: 12 },
});
