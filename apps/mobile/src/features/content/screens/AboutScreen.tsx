import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';

const HERO = require('../../../../assets/hero/hero3.png');
const HERO2 = require('../../../../assets/hero/hero4.png');

const STATS = [
  { value: '12k+', label: 'Użytkowników' },
  { value: '98%', label: 'Pozytywnych ocen' },
  { value: '50k+', label: 'Transakcji' },
];
const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'award', title: 'Autentyczność', desc: 'Każdy produkt jest opisany rzetelnie, a sprzedawcy budują reputację w oparciu o zaufanie.' },
  { icon: 'shield', title: 'Bezpieczne zakupy', desc: 'Bezpieczne płatności, ochrona kupujących i wsparcie zespołu na każdym etapie.' },
  { icon: 'users', title: 'Społeczność premium', desc: 'Dołącz do społeczności miłośników mody premium. Wymieniaj się inspiracjami.' },
];
const STEPS = [
  { n: '01', title: 'Wystaw lub znajdź', desc: 'Dodaj ogłoszenie w kilka minut albo przeglądaj sprawdzone oferty premium.' },
  { n: '02', title: 'Kup bezpiecznie', desc: 'Płatność jest chroniona, a środki trafiają do sprzedawcy dopiero po odbiorze.' },
  { n: '03', title: 'Buduj reputację', desc: 'Oceny i opinie tworzą zaufaną, premium społeczność.' },
];

/** O nas — port mobilnego widoku z weba. */
export function AboutScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={s.kickerRow}>
        <Text style={s.kicker}>O NAS</Text>
        <View style={s.kickerLine} />
      </View>
      <Text style={s.title}>Tworzymy modę,{'\n'}której można ufać</Text>
      <Text style={s.lead}>
        AdBox to miejsce, gdzie pasja do stylu spotyka się z bezpieczeństwem. Kupuj i sprzedawaj autentyczne ubrania, obuwie i akcesoria w społeczności sprawdzonych użytkowników.
      </Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        <Button title="Przeglądaj ogłoszenia" full onPress={() => navigation.navigate('Sklep')} />
        {!user && <Button title="Załóż konto" variant="outline" full onPress={() => navigation.navigate('Auth')} />}
      </View>
      <Image source={HERO} style={s.heroImg} />

      {/* Statystyki */}
      <View style={s.stats}>
        {STATS.map((st, i) => (
          <View key={st.label} style={[s.stat, i > 0 && s.statDivider]}>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Cechy */}
      <View style={{ gap: 14 }}>
        {FEATURES.map((f) => (
          <View key={f.title} style={s.feature}>
            <View style={s.featureIcon}><Icon name={f.icon} size={20} color={C.gold} /></View>
            <Text style={s.featureTitle}>{f.title}</Text>
            <Text style={s.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* Jak to działa */}
      <Text style={s.sectionKicker}>JAK TO DZIAŁA</Text>
      <View style={{ gap: 18, marginBottom: 20 }}>
        {STEPS.map((st) => (
          <View key={st.n} style={s.step}>
            <Text style={s.stepNum}>{st.n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.stepTitle}>{st.title}</Text>
              <Text style={s.stepDesc}>{st.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <Image source={HERO2} style={s.heroImg} />

      {/* CTA */}
      <View style={s.cta}>
        <Text style={s.ctaTitle}>Dołącz do AdBox</Text>
        <Text style={s.ctaSub}>Zacznij kupować i sprzedawać modę premium już dziś.</Text>
        <Button title={user ? 'Przeglądaj ogłoszenia' : 'Załóż konto'} full onPress={() => navigation.navigate(user ? 'Sklep' : 'Auth')} style={{ marginTop: 14 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 8 },
  kicker: { fontSize: 12, letterSpacing: 2, fontWeight: '700', color: C.gold },
  kickerLine: { width: 40, height: 1, backgroundColor: 'rgba(192,145,60,0.5)' },
  title: { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: C.ink, lineHeight: 36, marginBottom: 14 },
  lead: { fontSize: 15, color: C.inkSoft, lineHeight: 22, marginBottom: 20 },
  heroImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: C.goldSoft, marginBottom: 24 },

  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, marginBottom: 24 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: C.line },
  statValue: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: C.gold },
  statLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: C.muted, marginTop: 4, textAlign: 'center' },

  feature: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 18 },
  featureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: C.ink, marginBottom: 6 },
  featureDesc: { fontSize: 14, color: C.inkSoft, lineHeight: 20 },

  sectionKicker: { fontSize: 12, letterSpacing: 2, fontWeight: '700', color: C.gold, marginTop: 28, marginBottom: 16 },
  step: { flexDirection: 'row', gap: 14 },
  stepNum: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: 'rgba(192,145,60,0.5)', width: 32 },
  stepTitle: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink },
  stepDesc: { fontSize: 14, color: C.inkSoft, lineHeight: 20, marginTop: 2 },

  cta: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 22 },
  ctaTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.ink },
  ctaSub: { fontSize: 14, color: C.inkSoft, marginTop: 4 },
});
