import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';

/** Potwierdzenie publikacji — „Twoje ogłoszenie zostało opublikowane". */
export function ListingPublishedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string | undefined;
  const photoError = route.params?.photoError as boolean | undefined;

  return (
    <View style={s.root}>
      <View style={s.badge}>
        <Icon name="check" size={44} color="#fff" />
      </View>
      <Text style={s.title}>Twoje ogłoszenie{'\n'}zostało opublikowane</Text>
      <Text style={s.sub}>
        {photoError
          ? 'Oferta jest już widoczna, ale nie udało się wgrać wszystkich zdjęć. Możesz dodać je później w edycji.'
          : 'Twoja oferta jest już widoczna dla kupujących w AdBox.'}
      </Text>

      <View style={s.actions}>
        <Button
          title="Zobacz ogłoszenie"
          icon="eye"
          full
          onPress={() =>
            id &&
            navigation.reset({
              index: 2,
              routes: [{ name: 'Tabs' }, { name: 'MojeOgloszenia' }, { name: 'Produkt', params: { id } }],
            })
          }
        />
        <Button
          title="Przejdź do moich ogłoszeń"
          variant="ghost"
          full
          onPress={() => navigation.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'MojeOgloszenia' }] })}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  badge: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontFamily: SERIF, fontSize: 26, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 32 },
  sub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, marginTop: 12, maxWidth: 300 },
  actions: { alignSelf: 'stretch', marginTop: 32 },
});
