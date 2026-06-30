import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';

/**
 * Pełnoekranowy podgląd zdjęć — powiększone, przewijane poziomo (swipe w lewo/prawo),
 * jak na typowych stronach. Otwierany po kliknięciu zdjęcia oferty.
 */
export function ImageGalleryModal({
  images,
  visible,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ref = useRef<ScrollView>(null);
  const [active, setActive] = useState(initialIndex);

  // Po otwarciu ustaw na klikniętym zdjęciu.
  useEffect(() => {
    if (!visible) return;
    setActive(initialIndex);
    const t = setTimeout(() => ref.current?.scrollTo({ x: initialIndex * width, animated: false }), 30);
    return () => clearTimeout(t);
  }, [visible, initialIndex, width]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== active) setActive(i);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={s.root}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onEnd}
          contentOffset={{ x: initialIndex * width, y: 0 }}
        >
          {images.map((uri, i) => (
            <View key={i} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={{ uri }} style={{ width, height: height * 0.86 }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {/* Górny pasek: licznik + zamknij */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={s.counter}>{active + 1} / {images.length}</Text>
          <TouchableOpacity style={s.close} onPress={onClose} hitSlop={12}>
            <Icon name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Kropki */}
        {images.length > 1 && (
          <View style={[s.dots, { bottom: insets.bottom + 18 }]} pointerEvents="none">
            {images.map((_, i) => (
              <View key={i} style={[s.dot, i === active ? s.dotOn : s.dotOff]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0A08' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  counter: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 999 },
  dotOn: { width: 18, backgroundColor: C.gold },
  dotOff: { width: 6, backgroundColor: 'rgba(255,255,255,0.5)' },
});
