import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { ORDER, ORDER_FLOW, orderStatusLabel, grosze, type OrderStatus } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';

const STEP_META: Record<OrderStatus, { icon: IconName; desc: string }> = {
  PENDING: { icon: 'box', desc: 'Zamówienie zostało przyjęte' },
  PAID: { icon: 'card', desc: 'Płatność została zaksięgowana' },
  SHIPPED: { icon: 'truck', desc: 'Twoja paczka jest w drodze' },
  DELIVERED: { icon: 'box', desc: 'Paczka została dostarczona' },
  COMPLETED: { icon: 'check', desc: 'Zamówienie zostało zakończone' },
  CANCELLED: { icon: 'x', desc: '' },
  REFUNDED: { icon: 'x', desc: '' },
  DISPUTED: { icon: 'x', desc: '' },
};

/** Zamówienie — timeline statusu + produkt + szczegóły transakcji/dostawy/płatności. */
export function OrderScreen() {
  const o = ORDER;
  const currentIdx = ORDER_FLOW.indexOf(o.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.h1}>Zamówienie #{o.id}</Text>
      <Text style={s.sub}>Złożone: {o.placedAtLabel}</Text>

      {/* Status — timeline */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Status zamówienia</Text>
        {ORDER_FLOW.map((st, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const meta = STEP_META[st];
          return (
            <View key={st} style={s.step}>
              <View style={s.stepRail}>
                <View style={[s.stepDot, active ? s.dotActive : done ? s.dotDone : s.dotIdle]}>
                  <Icon name={meta.icon} size={18} color={active ? '#fff' : done ? C.gold : C.muted} />
                </View>
                {i < ORDER_FLOW.length - 1 && <View style={[s.stepLine, { backgroundColor: done ? 'rgba(192,145,60,0.4)' : C.line }]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 18 }}>
                <Text style={[s.stepTitle, { color: active ? C.gold : C.ink }]}>{orderStatusLabel(st).toUpperCase()}</Text>
                <Text style={s.stepDesc}>{meta.desc}</Text>
                {active ? <Text style={s.stepDesc}>{o.placedAtLabel}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Produkt */}
      <View style={s.card}>
        <Text style={s.kicker}>PRODUKT</Text>
        <View style={s.prodRow}>
          <Image source={{ uri: o.listing.imageUrl }} style={s.prodImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.prodTitle}>{o.listing.title}</Text>
            <Text style={s.prodMeta}>{o.listing.color}, Rozmiar {o.listing.size}</Text>
            <Text style={s.prodMeta}>1 × {grosze(o.listing.price)}</Text>
          </View>
          <Text style={s.prodAmount}>{grosze(o.amount)}</Text>
        </View>
      </View>

      {/* Szczegóły transakcji */}
      <View style={s.card}>
        <Text style={s.kicker}>SZCZEGÓŁY TRANSAKCJI</Text>
        <Line k="Numer zamówienia" v={`#${o.id}`} />
        <Line k="Data złożenia" v={o.placedAtLabel ?? ''} />
        <Line k="Suma zamówienia" v={grosze(o.amount)} />
      </View>

      {/* Dostawa */}
      <View style={s.card}>
        <Text style={s.kicker}>DOSTAWA</Text>
        <View style={s.detailRow}>
          <Icon name="truck" size={16} color={C.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.detailMain}>{o.shippingMethod}</Text>
            <Text style={s.detailSub}>Dostawa przewidywana: 27.05.2024</Text>
          </View>
          <Text style={s.detailMain}>{o.shippingFee === 0 ? '0,00 zł' : grosze(o.shippingFee)}</Text>
        </View>
      </View>

      {/* Płatność */}
      <View style={s.card}>
        <Text style={s.kicker}>PŁATNOŚĆ</Text>
        <View style={s.detailRow}>
          <Icon name="card" size={16} color={C.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.detailMain}>{o.paymentMethod}</Text>
            <Text style={s.detailSuccess}>Płatność opłacona</Text>
          </View>
          <Text style={s.detailMain}>{grosze(o.amount)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.line}>
      <Text style={s.lineKey}>{k}</Text>
      <Text style={s.lineVal}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink },
  sub: { fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: C.muted, marginBottom: 10 },

  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  stepDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: C.gold },
  dotDone: { backgroundColor: C.goldSoft },
  dotIdle: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  stepLine: { width: 2, flex: 1, minHeight: 24 },
  stepTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  stepDesc: { fontSize: 12, color: C.muted, marginTop: 1 },

  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prodImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.goldSoft },
  prodTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  prodMeta: { fontSize: 12, color: C.muted, marginTop: 1 },
  prodAmount: { fontSize: 15, fontWeight: '700', color: C.ink },

  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  lineKey: { fontSize: 14, color: C.muted },
  lineVal: { fontSize: 14, fontWeight: '600', color: C.ink },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailMain: { fontSize: 14, color: C.ink },
  detailSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  detailSuccess: { fontSize: 12, color: '#2A7A4A', marginTop: 1 },
});
