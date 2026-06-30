import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ORDER, PAYMENT_METHODS, grosze, type PaymentMethod } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';

/** Opcje dostawy (wzorzec jak w innych projektach: paczkomat / kurier / odbiór). Ceny w groszach. */
const DELIVERY = [
  { id: 'inpost', title: 'Paczkomat InPost', sub: 'Odbiór 24/7', fee: 1299 },
  { id: 'kurier', title: 'Kurier (DPD / DHL)', sub: 'Dostawa pod drzwi', fee: 1599 },
  { id: 'pickup', title: 'Odbiór osobisty', sub: 'Po ustaleniu ze sprzedającym', fee: 0 },
];

/** Płatność — realny przedmiot + wybór dostawy + metoda płatności + podsumowanie. */
export function CheckoutScreen() {
  const route = useRoute<any>();
  // Realny przedmiot z „Kup teraz"; gdy wejdziesz bez parametru — demo z mocka.
  const item = route.params?.item ?? {
    id: '', title: ORDER.listing.title, price: ORDER.listing.price,
    imageUrl: ORDER.listing.imageUrl, size: ORDER.listing.size, color: ORDER.listing.color,
  };
  const [method, setMethod] = useState<PaymentMethod>('BLIK');
  const [delivery, setDelivery] = useState(DELIVERY[0].id);
  const deliveryFee = DELIVERY.find((d) => d.id === delivery)?.fee ?? 0;
  const total = item.price + deliveryFee;
  const meta = [item.size ? `Rozmiar: ${item.size}` : null, item.color].filter(Boolean).join(' · ');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.h1}>Podsumowanie zamówienia</Text>

      <Text style={s.section}>Wybierz dostawę</Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {DELIVERY.map((d) => {
          const active = delivery === d.id;
          return (
            <TouchableOpacity key={d.id} style={[s.method, active && s.methodActive]} onPress={() => setDelivery(d.id)} activeOpacity={0.85}>
              <View style={[s.radio, { borderColor: active ? C.gold : C.line }]}>{active && <View style={s.radioDot} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.methodTitle}>{d.title}</Text>
                <Text style={s.methodSub}>{d.sub}</Text>
              </View>
              <Text style={s.methodPrice}>{d.fee === 0 ? 'Gratis' : grosze(d.fee)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.section}>Wybierz metodę płatności</Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {PAYMENT_METHODS.map((pm) => {
          const active = method === pm.method;
          return (
            <TouchableOpacity
              key={pm.method}
              style={[s.method, active && s.methodActive]}
              onPress={() => setMethod(pm.method)}
              activeOpacity={0.85}
            >
              <View style={[s.radio, { borderColor: active ? C.gold : C.line }]}>
                {active && <View style={s.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.methodTitle}>{pm.title}</Text>
                <Text style={s.methodSub}>{pm.sub}</Text>
              </View>
              <Icon name="chevronRight" size={16} color={C.muted} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.statusRow}>
        <Text style={s.statusLabel}>Status płatności</Text>
        <View style={s.statusBadge}><Text style={s.statusBadgeText}>Gotowe do płatności</Text></View>
      </View>
      <View style={s.secureRow}>
        <Icon name="lock" size={13} color={C.muted} />
        <Text style={s.secureText}>Przekierujemy Cię do bezpiecznego serwisu płatności.</Text>
      </View>

      {/* Podsumowanie */}
      <View style={s.summary}>
        <View style={s.prodRow}>
          <Image source={{ uri: item.imageUrl }} style={s.prodImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.prodTitle} numberOfLines={1}>{item.title}</Text>
            {meta ? <Text style={s.prodMeta}>{meta}</Text> : null}
            <Text style={s.prodMeta}>1 × {grosze(item.price)}</Text>
          </View>
        </View>
        <View style={s.sumLines}>
          <View style={s.sumLine}><Text style={s.sumMuted}>Wartość produktów</Text><Text style={s.sumVal}>{grosze(item.price)}</Text></View>
          <View style={s.sumLine}><Text style={s.sumMuted}>Dostawa</Text><Text style={s.sumVal}>{deliveryFee === 0 ? 'Gratis' : grosze(deliveryFee)}</Text></View>
        </View>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Do zapłaty</Text>
          <Text style={s.totalValue}>{grosze(total)}</Text>
        </View>
        <Button title={`Zapłać ${grosze(total)}`} icon="lock" full onPress={() => Alert.alert('Już wkrótce', 'Płatności będą dostępne w kolejnym etapie — na razie zakupu nie finalizujemy.')} />
        <Text style={s.note}>Płatność obsługiwana przez zewnętrznego operatora.{'\n'}Twoje dane są bezpieczne.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginBottom: 20 },
  section: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 12 },

  method: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  methodActive: { borderColor: C.gold },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold },
  methodTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  methodSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  methodPrice: { fontSize: 13, fontWeight: '700', color: C.ink },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  statusBadge: { backgroundColor: 'rgba(42,122,74,0.1)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#2A7A4A' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  secureText: { fontSize: 12, color: C.muted, flex: 1 },

  summary: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 18 },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  prodImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.goldSoft },
  prodTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  prodMeta: { fontSize: 12, color: C.muted, marginTop: 1 },
  sumLines: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 12, gap: 6 },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between' },
  sumMuted: { fontSize: 14, color: C.muted },
  sumVal: { fontSize: 14, color: C.ink },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.ink },
  totalValue: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink },
  note: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 16 },
});
