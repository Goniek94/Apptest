import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';
import { updateMe } from '@/features/profile/api/users';

const NIP_RE = /^\d{10}$/;

/** Dane osobowe — edycja profilu zapisywana przez PATCH /users/me. */
export function SettingsDataScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const isBusiness = user?.accountType === 'BUSINESS';

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [companyName, setCompanyName] = useState(user?.companyName ?? '');
  const [nip, setNip] = useState(user?.nip ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (displayName.trim().length < 2) return Alert.alert('Uzupełnij', 'Podaj nazwę (min. 2 znaki).');
    if (isBusiness) {
      if (companyName.trim().length < 2) return Alert.alert('Uzupełnij', 'Podaj nazwę firmy.');
      if (nip && !NIP_RE.test(nip.trim())) return Alert.alert('NIP', 'NIP musi mieć 10 cyfr.');
    }
    setSaving(true);
    try {
      await updateMe({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        ...(isBusiness ? { companyName: companyName.trim(), nip: nip.trim() || undefined } : {}),
      });
      await refreshUser();
      Alert.alert('Zapisano', 'Dane zostały zaktualizowane.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać danych.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>E-mail</Text>
      <View style={[s.inputRow, s.readonly]}>
        <Icon name="mail" size={17} color={C.muted} />
        <Text style={s.readonlyText}>{user?.email}</Text>
      </View>
      <Text style={s.hint}>Adresu e-mail nie można tu zmienić.</Text>

      <Text style={s.label}>Nazwa wyświetlana</Text>
      <View style={s.inputRow}>
        <Icon name="user" size={17} color={C.muted} />
        <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} placeholder="Jak Cię wyświetlać?" placeholderTextColor={C.muted} />
      </View>

      <Text style={s.label}>Opis (bio)</Text>
      <TextInput style={[s.input, s.textarea]} value={bio} onChangeText={(t) => setBio(t.slice(0, 300))} placeholder="Kilka słów o Tobie…" placeholderTextColor={C.muted} multiline />

      {isBusiness && (
        <>
          <Text style={s.label}>Nazwa firmy</Text>
          <View style={s.inputRow}>
            <Icon name="tag" size={17} color={C.muted} />
            <TextInput style={s.input} value={companyName} onChangeText={setCompanyName} placeholder="Nazwa firmy" placeholderTextColor={C.muted} />
          </View>

          <Text style={s.label}>NIP</Text>
          <View style={s.inputRow}>
            <Icon name="edit" size={17} color={C.muted} />
            <TextInput style={s.input} value={nip} onChangeText={setNip} placeholder="10 cyfr" placeholderTextColor={C.muted} keyboardType="number-pad" maxLength={10} />
          </View>
        </>
      )}

      <Button title="Zapisz zmiany" icon="check" full loading={saving} onPress={save} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 8, marginTop: 18 },
  hint: { fontSize: 12, color: C.muted, marginTop: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
  readonly: { backgroundColor: C.surfaceAlt },
  readonlyText: { flex: 1, paddingVertical: 13, fontSize: 14, color: C.inkSoft },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: C.ink },
  textarea: { minHeight: 90, textAlignVertical: 'top', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
});
