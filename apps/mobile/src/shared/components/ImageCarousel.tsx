import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { C } from '@/shared/theme';

/**
 * Pozioma karuzela zdjęcia głównego — swipe w lewo/prawo, kropki u dołu.
 * Klik w zdjęcie wywołuje onPress (np. otwarcie pełnoekranowej galerii).
 * Wypełnia rodzica (rodzic nadaje wymiary, np. aspectRatio).
 */
export function ImageCarousel({
  images,
  active,
  onActiveChange,
  onPress,
}: {
  images: string[];
  active: number;
  onActiveChange: (i: number) => void;
  onPress?: () => void;
}) {
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);

  // Zmiana aktywnego z zewnątrz (klik w miniaturę) → przewiń karuzelę.
  useEffect(() => {
    if (w > 0) ref.current?.scrollTo({ x: active * w, animated: true });
  }, [active, w]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    if (i !== active) onActiveChange(i);
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
      >
        {images.map((uri, i) => (
          <TouchableOpacity key={i} activeOpacity={0.95} onPress={onPress} style={{ width: w, height: '100%' }}>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={s.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View key={i} style={[s.dot, i === active ? s.dotOn : s.dotOff]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 999 },
  dotOn: { width: 16, backgroundColor: C.gold },
  dotOff: { width: 6, backgroundColor: 'rgba(255,255,255,0.6)' },
});
