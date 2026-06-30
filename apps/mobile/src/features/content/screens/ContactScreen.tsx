import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';

const METHODS: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'chat', title: 'Czat z obsługą', sub: 'Odpowiadamy zwykle w kilka minut' },
  { icon: 'mail', title: 'pomoc@modamarket.pl', sub: 'Odpowiedź do 24 godzin' },
  { icon: 'clock', title: 'Pon.–Pt. 9:00–18:00', sub: 'Godziny pracy wsparcia' },
];

/** Kontakt — metody kontaktu + krótki formularz wiadomości. */
export function ContactScreen() {
  const navigation = useNavigation<any>();
  const [msg, setMsg] = useState('');

  const send = () => {
    if (msg.trim().length < 5) return Alert.alert('Napisz wiadomość', 'Opisz krótko, w czym możemy pomóc.');
    Alert.alert('Wysłano', 'Dziękujemy! Odpowiemy najszybciej, jak to możliwe.', [{ text: 'OK', onPress: () => setMsg('') }]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.lead}>Masz pytanie lub problem? Jesteśmy do dyspozycji.</Text>

      <View style={s.card}>
        {METHODS.map((m, i) => (
          <TouchableOpacity
            key={m.title}
            style={[s.row, i > 0 && s.rowDivider]}
            activeOpacity={0.7}
            onPress={i === 0 ? () => navigation.navigate('Wiadomości') : undefined}
          >
            <View style={s.rowIcon}><Icon name={m.icon} size={18} color={C.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{m.title}</Text>
              <Text style={s.rowSub}>{m.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.h2}>Napisz do nas</Text>
      <TextInput
        style={s.textarea}
        value={msg}
        onChangeText={(t) => setMsg(t.slice(0, 1000))}
        placeholder="Opisz, w czym możemy pomóc…"
        placeholderTextColor={C.muted}
        multiline
      />
      <Button title="Wyślij wiadomość" icon="send" full onPress={send} style={{ marginTop: 14 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  lead: { fontSize: 15, color: C.inkSoft, lineHeight: 22, marginBottom: 20, marginTop: 4 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.line },
  rowIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  h2: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 },
  textarea: { minHeight: 120, textAlignVertical: 'top', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink },
});
