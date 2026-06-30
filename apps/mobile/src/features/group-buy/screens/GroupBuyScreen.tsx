import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { IMG, grosze } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';

const STD = 29900;
const GROUP = 25900;
const JOINED = 3;
const THRESHOLD = 5;

const STEPS: { icon: IconName; n: string; title: string; sub: string }[] = [
  { icon: 'users', n: '1.', title: 'Dołącz do grupy', sub: 'Wejdź do istniejącej grupy lub stwórz własną.' },
  { icon: 'clock', n: '2.', title: 'Poczekaj na komplet', sub: 'Potrzebujemy 5 osób, aby odblokować cenę.' },
  { icon: 'bag', n: '3.', title: 'Kup taniej', sub: 'Gdy grupa się zapełni, kupujesz taniej.' },
];

/** Odliczanie HH:MM:SS (jak useCountdown z weba). */
function useCountdown(start: number) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function GroupBuyScreen() {
  const time = useCountdown(18 * 3600 + 42 * 60 + 15);
  const pct = Math.round((JOINED / THRESHOLD) * 100);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.h1}>Kup w grupie</Text>
      <Text style={s.lead}>Dołącz do wspólnego zakupu i odblokuj lepszą cenę.</Text>

      {/* Karta produktu */}
      <View style={s.card}>
        <Image source={{ uri: IMG.nb }} style={s.prodImg} />
        <View style={{ padding: 18 }}>
          <Text style={s.prodTitle}>Sneakersy 530</Text>
          <Text style={s.prodBrand}>New Balance</Text>
          <View style={s.divider} />
          <Text style={s.smallMuted}>Cena standardowa</Text>
          <Text style={s.stdPrice}>{grosze(STD)}</Text>
          <View style={s.groupPrice}>
            <View style={s.rowGap}>
              <Icon name="tag" size={15} color={C.gold} />
              <Text style={s.groupPriceLabel}>Cena grupowa</Text>
            </View>
            <Text style={s.groupPriceValue}>{grosze(GROUP)}</Text>
          </View>
        </View>
      </View>

      {/* Postęp grupy */}
      <View style={[s.card, { padding: 18 }]}>
        <Text style={s.progressTitle}>{JOINED} z {THRESHOLD} osób do odblokowania ceny</Text>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%` }]} />
          <View style={[s.marker, { left: `${pct}%` }]}>
            <Icon name="users" size={13} color="#fff" />
          </View>
        </View>

        <View style={s.partsRow}>
          <View>
            <Text style={[s.smallMuted, { marginBottom: 8 }]}>Uczestnicy</Text>
            <View style={{ flexDirection: 'row' }}>
              {[0, 1, 2].map((i) => (
                <Image key={i} source={{ uri: IMG.avatar }} style={[s.partAvatar, { marginLeft: i === 0 ? 0 : -8 }]} />
              ))}
              {[0, 1].map((i) => (
                <View key={`e${i}`} style={[s.partEmpty, { marginLeft: -8 }]}>
                  <Icon name="user" size={16} color={C.muted} />
                </View>
              ))}
            </View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.smallMuted}>Kończy się za</Text>
            <Text style={s.countdown}>{time}</Text>
            <Icon name="clock" size={16} color={C.gold} />
          </View>
        </View>

        <View style={s.benefits}>
          <View style={s.benefit}>
            <Icon name="tag" size={17} color={C.gold} />
            <Text style={s.benefitText}>Oszczędzasz {grosze(STD - GROUP)}</Text>
          </View>
          <View style={s.benefit}>
            <Icon name="truck" size={17} color={C.gold} />
            <Text style={s.benefitText}>Darmowa dostawa po odblokowaniu</Text>
          </View>
        </View>
      </View>

      {/* Jak to działa */}
      <View style={[s.card, { padding: 18 }]}>
        <Text style={s.howTitle}>Jak to działa?</Text>
        <View style={s.steps}>
          {STEPS.map((st) => (
            <View key={st.n} style={s.step}>
              <View style={s.stepIcon}><Icon name={st.icon} size={18} color={C.gold} /></View>
              <Text style={s.stepNum}>{st.n}</Text>
              <Text style={s.stepTitle}>{st.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button title="Dołącz do grupy" icon="users" full style={{ marginBottom: 12 }} />
      <Button title="Stwórz własną grupę" icon="plus" variant="outline" full />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: C.ink },
  lead: { fontSize: 14, color: C.muted, marginTop: 2, marginBottom: 18 },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  prodImg: { width: '100%', height: 200, backgroundColor: C.goldSoft },
  prodTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.ink },
  prodBrand: { fontSize: 14, color: C.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  smallMuted: { fontSize: 13, color: C.muted },
  stdPrice: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink },
  groupPrice: { backgroundColor: 'rgba(242,233,213,0.5)', borderWidth: 1, borderColor: 'rgba(192,145,60,0.25)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupPriceLabel: { fontSize: 13, fontWeight: '700', color: C.gold },
  groupPriceValue: { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: C.gold, marginTop: 2 },

  progressTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 14 },
  track: { height: 10, borderRadius: 999, backgroundColor: C.line, marginBottom: 24, marginTop: 4 },
  fill: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 999, backgroundColor: C.gold },
  marker: { position: 'absolute', top: -9, marginLeft: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },

  partsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  partAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.surface },
  partEmpty: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.surface, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  countdown: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginVertical: 2 },

  benefits: { flexDirection: 'row', gap: 12, marginTop: 20 },
  benefit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,233,213,0.4)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  benefitText: { flex: 1, fontSize: 12, color: C.ink },

  howTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 14 },
  steps: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, alignItems: 'center' },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNum: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.gold },
  stepTitle: { fontSize: 12, fontWeight: '600', color: C.ink, textAlign: 'center', marginTop: 2 },
});
