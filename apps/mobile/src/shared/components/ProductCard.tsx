import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { grosze, conditionLabel, type Listing } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';

/**
 * Mobilny kafelek produktu — wierne odwzorowanie `MobileCard`/`ShopCard` z weba:
 * biały kafelek z cieniem, zdjęcie 4:5, plakietka stanu (lewy-góra), serce (prawy-góra),
 * pod spodem wyśrodkowane: serif tytuł → marka → cena.
 */
export function ProductCard({ p }: { p: Listing }) {
  const navigation = useNavigation<any>();
  const [fav, setFav] = useState(false);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Produkt', { id: p.id })}
    >
      <View style={s.imageWrap}>
        {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={s.image} /> : null}
        <View style={s.badge}>
          <Text style={s.badgeText}>{conditionLabel(p.condition)}</Text>
        </View>
        <TouchableOpacity
          style={s.heart}
          activeOpacity={0.8}
          onPress={() => setFav((v) => !v)}
        >
          <Icon name="heart" size={16} color={fav ? '#B23B36' : C.ink} fill={fav ? '#B23B36' : 'none'} />
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{p.title}</Text>
        <Text style={s.brand}>{p.brand}</Text>
        <Text style={s.price}>{grosze(p.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#281E14',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  imageWrap: { aspectRatio: 4 / 5, backgroundColor: C.goldSoft },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: C.ink },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  body: { padding: 12, alignItems: 'center' },
  title: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: C.ink, lineHeight: 18 },
  brand: { fontSize: 12, color: C.muted, marginTop: 2 },
  price: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink, marginTop: 6 },
});
