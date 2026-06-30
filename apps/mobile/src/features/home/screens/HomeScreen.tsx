import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { IMG, type Listing } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { ProductCard } from '@/shared/components/ProductCard';
import { fetchListings } from '@/features/catalog/api/listings';

type SlideAction = 'search' | 'group' | 'safe';
const SLIDES: { image: any; kicker: string; icon?: 'users' | 'shield'; title: string; sub: string; cta: string; action: SlideAction }[] = [
  {
    image: require('../../../../assets/hero/hero3.png'),
    kicker: 'NOWA KOLEKCJA', title: 'Ponadczasowa elegancja',
    sub: 'Odkryj starannie wyselekcjonowane marki premium.', cta: 'ODKRYJ TERAZ', action: 'search',
  },
  {
    image: require('../../../../assets/hero/hero2.png'),
    kicker: 'KUP W GRUPIE', icon: 'users', title: 'Im więcej osób,\ntym niższa cena',
    sub: 'Kupujcie razem i płaćcie mniej za te same przedmioty.', cta: 'SPRAWDŹ', action: 'group',
  },
  {
    image: require('../../../../assets/hero/hero1.png'),
    kicker: 'BEZPIECZEŃSTWO', icon: 'shield', title: 'Kupuj bezpiecznie',
    sub: 'Ochrona kupującego i sprawdzeni sprzedawcy na każdym kroku.', cta: 'DOWIEDZ SIĘ', action: 'safe',
  },
];

/** Auto-przewijany slider hero (3 slajdy) — pętla co ~4,5 s, z kropkami i swipe. */
function HeroSlider({ onAction }: { onAction: (a: SlideAction) => void }) {
  const [w, setW] = useState(0);
  const [idx, setIdx] = useState(0);
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    if (!w) return;
    const t = setInterval(() => {
      setIdx((cur) => {
        const next = (cur + 1) % SLIDES.length;
        ref.current?.scrollTo({ x: next * w, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [w]);

  return (
    <View style={s.hero} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, w)))}
      >
        {w > 0 && SLIDES.map((sl, i) => (
          <ImageBackground key={i} source={sl.image} style={[s.heroBg, { width: w }]} imageStyle={{ resizeMode: 'cover' }}>
            <LinearGradient
              colors={['rgba(28,24,18,0.88)', 'rgba(28,24,18,0.45)', 'rgba(28,24,18,0.05)']}
              locations={[0, 0.45, 0.78]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.heroContent}>
              {sl.icon ? (
                <View style={s.heroKickerRow}>
                  <Icon name={sl.icon} size={12} color={C.gold} />
                  <Text style={s.heroKicker}>{sl.kicker}</Text>
                </View>
              ) : (
                <Text style={s.heroKicker}>{sl.kicker}</Text>
              )}
              <Text style={s.heroTitle}>{sl.title}</Text>
              <Text style={s.heroSub}>{sl.sub}</Text>
              <TouchableOpacity style={s.heroBtn} onPress={() => onAction(sl.action)} activeOpacity={0.85}>
                <Text style={s.heroBtnText}>{sl.cta}</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>
      <View style={s.dots} pointerEvents="none">
        {SLIDES.map((_, i) => <View key={i} style={[s.dot, i === idx ? s.dotActive : s.dotIdle]} />)}
      </View>
    </View>
  );
}

const MOBILE_CATS = [
  { label: 'Kobiety', img: IMG.dress },
  { label: 'Mężczyźni', img: IMG.blazer },
  { label: 'Torebki', img: IMG.bag },
  { label: 'Obuwie', img: IMG.sneaker },
  { label: 'Akcesoria', img: IMG.sunglasses },
];

/** Siatka 2-kolumnowa kart produktu. */
function Grid2({ items }: { items: Listing[] }) {
  const rows: Listing[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: 20 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 12 }}>
          {row.map((p, i) => <ProductCard key={`${p.id}-${i}`} p={p} />)}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

function MobileRow({ title, items, onAll }: { title: string; items: Listing[]; onAll: () => void }) {
  return (
    <View style={{ marginTop: 28 }}>
      <View style={s.rowHead}>
        <Text style={s.rowTitle}>{title}</Text>
        <TouchableOpacity onPress={onAll}><Text style={s.link}>Zobacz wszystkie</Text></TouchableOpacity>
      </View>
      <Grid2 items={items} />
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const goSearch = () => navigation.navigate('Sklep');
  const onSlide = (a: SlideAction) => {
    if (a === 'group') navigation.navigate('KupWGrupie');
    else if (a === 'safe') navigation.navigate('Pomoc');
    else navigation.navigate('Sklep');
  };

  const [items, setItems] = useState<Listing[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchListings({ limit: 12 })
      .then((res) => { if (!cancelled) setItems(res.items); })
      .catch(() => { /* brak sieci/backendu → sekcje zostają puste */ });
    return () => { cancelled = true; };
  }, []);

  const polecane = items.slice(0, 6);
  const aktualnosci = items.slice(6, 12);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Szukaj */}
      <View style={s.searchRow}>
        <View style={s.searchInput}>
          <Icon name="search" size={17} color={C.muted} />
          <TextInput
            placeholder="Szukaj marek, produktów, stylów…"
            placeholderTextColor={C.muted}
            style={s.searchText}
            onFocus={goSearch}
          />
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={goSearch}>
          <Icon name="sliders" size={18} color={C.ink} />
        </TouchableOpacity>
      </View>

      {/* Slider hero (auto-przewijany) */}
      <HeroSlider onAction={onSlide} />

      {/* Kategorie */}
      <View style={{ marginTop: 28 }}>
        <View style={s.rowHead}>
          <Text style={s.rowTitle}>Kategorie</Text>
          <TouchableOpacity onPress={goSearch}><Text style={s.link}>Zobacz wszystkie</Text></TouchableOpacity>
        </View>
        <View style={s.cats}>
          {MOBILE_CATS.map((c) => (
            <TouchableOpacity key={c.label} style={s.cat} onPress={goSearch} activeOpacity={0.8}>
              <Image source={{ uri: c.img }} style={s.catImg} />
              <Text style={s.catLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Produkty */}
      {polecane.length > 0 && <MobileRow title="Polecane dla Ciebie" items={polecane} onAll={goSearch} />}
      {aktualnosci.length > 0 && <MobileRow title="Aktualności" items={aktualnosci} onAll={goSearch} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchText: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  filterBtn: {
    width: 44,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { borderRadius: 20, overflow: 'hidden', height: 220 },
  heroBg: { flex: 1, justifyContent: 'center' },
  heroContent: { paddingHorizontal: 20, maxWidth: '70%' },
  heroKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroKicker: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', color: C.gold, marginBottom: 6 },
  heroTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: '#fff', lineHeight: 24, marginBottom: 8 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17, marginBottom: 12 },
  heroBtn: { backgroundColor: C.gold, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  heroBtnText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 999 },
  dotActive: { width: 16, backgroundColor: C.gold },
  dotIdle: { width: 6, backgroundColor: 'rgba(255,255,255,0.5)' },

  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rowTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink },
  link: { fontSize: 12, fontWeight: '700', color: C.gold },

  cats: { flexDirection: 'row', justifyContent: 'space-between' },
  cat: { alignItems: 'center', gap: 6 },
  catImg: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.line },
  catLabel: { fontSize: 11, color: C.inkSoft },

  group: { borderRadius: 20, overflow: 'hidden', height: 130, marginTop: 28 },
  groupBg: { flex: 1, justifyContent: 'center', backgroundColor: C.ink },
  groupContent: { paddingHorizontal: 20 },
  groupKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  groupKicker: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', color: C.gold },
  groupTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: '#fff', lineHeight: 22 },
});
