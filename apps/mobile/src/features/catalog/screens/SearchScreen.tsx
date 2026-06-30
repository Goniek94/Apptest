import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { grosze, conditionLabel, type Listing, type ItemCondition } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { ProductGrid } from '@/shared/components/ProductGrid';
import { fetchListings, type ListingsQuery } from '@/features/catalog/api/listings';
import { fetchCategoryTree, type CategoryTree } from '@/features/catalog/api/categories';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'];
const COLORS = ['Beżowy', 'Czarny', 'Biały', 'Czerwony', 'Niebieski', 'Zielony', 'Brązowy', 'Szary', 'Granatowy', 'Różowy'];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: 'Nowy' },
  { value: 'LIKE_NEW', label: 'Jak nowy' },
  { value: 'VERY_GOOD', label: 'Bardzo dobry' },
  { value: 'GOOD', label: 'Dobry' },
];
const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: 'do100', label: 'do 100 zł', max: 9999 },
  { key: '100-300', label: '100–300 zł', min: 10000, max: 29999 },
  { key: '300-700', label: '300–700 zł', min: 30000, max: 69999 },
  { key: '700+', label: '700 zł+', min: 70000 },
];
const SORTS: { key: ListingsQuery['sort']; label: string }[] = [
  { key: 'newest', label: 'Najnowsze' },
  { key: 'price_asc', label: 'Cena: rosnąco' },
  { key: 'price_desc', label: 'Cena: malejąco' },
];
const FACETS = ['Kategoria', 'Rozmiar', 'Kolor', 'Stan', 'Cena'] as const;
type Facet = (typeof FACETS)[number];

/** Sklep / Szukaj — pełne filtry (kategoria/rozmiar/kolor/stan/cena) + sort + widok, podpięte do API. */
export function SearchScreen() {
  const navigation = useNavigation<any>();
  const [tree, setTree] = useState<CategoryTree[]>([]);

  const [q, setQ] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>();
  const [size, setSize] = useState<string>();
  const [color, setColor] = useState<string>();
  const [condition, setCondition] = useState<ItemCondition>();
  const [priceKey, setPriceKey] = useState<string>();
  const [sort, setSort] = useState<ListingsQuery['sort']>('newest');

  const [open, setOpen] = useState<Facet | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategoryTree().then(setTree).catch(() => {}); }, []);

  useEffect(() => {
    const range = PRICE_RANGES.find((r) => r.key === priceKey);
    const params: ListingsQuery = {
      q: q.trim() || undefined,
      categorySlug, size, color, condition,
      minPrice: range?.min, maxPrice: range?.max,
      sort,
    };
    setLoading(true);
    const t = setTimeout(() => {
      fetchListings(params)
        .then((r) => { setItems(r.items); setTotal(r.total); })
        .catch(() => { setItems([]); setTotal(0); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, categorySlug, size, color, condition, priceKey, sort]);

  const selectedLabel = (f: Facet): string | undefined => {
    if (f === 'Kategoria') return tree.find((t) => t.slug === categorySlug)?.name;
    if (f === 'Rozmiar') return size;
    if (f === 'Kolor') return color;
    if (f === 'Stan') return CONDITIONS.find((c) => c.value === condition)?.label;
    if (f === 'Cena') return PRICE_RANGES.find((r) => r.key === priceKey)?.label;
    return undefined;
  };
  const activeCount = [categorySlug, size, color, condition, priceKey].filter(Boolean).length;
  const clearAll = () => { setCategorySlug(undefined); setSize(undefined); setColor(undefined); setCondition(undefined); setPriceKey(undefined); setOpen(null); };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Szukaj + reset filtrów */}
      <View style={s.searchRow}>
        <View style={s.searchInput}>
          <Icon name="search" size={17} color={C.muted} />
          <TextInput placeholder="Szukaj marek, produktów, stylów…" placeholderTextColor={C.muted} style={s.searchText} value={q} onChangeText={setQ} autoCapitalize="none" />
        </View>
        <TouchableOpacity style={s.filterToggle} onPress={() => activeCount && clearAll()} activeOpacity={0.8}>
          <Icon name="sliders" size={18} color={C.ink} />
          {activeCount > 0 && <View style={s.countDot}><Text style={s.countDotText}>{activeCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Pigułki filtrów */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
        {FACETS.map((f) => {
          const isOpen = open === f;
          const sel = selectedLabel(f);
          return (
            <TouchableOpacity key={f} style={[s.pill, isOpen ? s.pillOpen : sel ? s.pillActive : null]} onPress={() => { setOpen(isOpen ? null : f); setSortOpen(false); }} activeOpacity={0.85}>
              <Text style={[s.pillText, isOpen && { color: '#fff' }]}>{sel ? `${f}: ${sel}` : f}</Text>
              <Icon name="chevronDown" size={13} color={isOpen ? '#fff' : C.muted} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Panel opcji */}
      {open && (
        <View style={s.panel}>
          <View style={s.panelHead}>
            <Text style={s.panelTitle}>{open}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {selectedLabel(open) ? (
                <TouchableOpacity onPress={() => {
                  if (open === 'Kategoria') setCategorySlug(undefined);
                  else if (open === 'Rozmiar') setSize(undefined);
                  else if (open === 'Kolor') setColor(undefined);
                  else if (open === 'Stan') setCondition(undefined);
                  else if (open === 'Cena') setPriceKey(undefined);
                }}>
                  <Text style={s.clear}>Wyczyść</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => setOpen(null)} hitSlop={8}><Icon name="x" size={16} color={C.muted} /></TouchableOpacity>
            </View>
          </View>

          <View style={s.chips}>
            {open === 'Kategoria' && tree.map((t) => (
              <Chip key={t.slug} label={t.name} active={categorySlug === t.slug} onPress={() => setCategorySlug(categorySlug === t.slug ? undefined : t.slug)} />
            ))}
            {open === 'Rozmiar' && SIZES.map((sz) => (
              <Chip key={sz} label={sz} active={size === sz} onPress={() => setSize(size === sz ? undefined : sz)} />
            ))}
            {open === 'Kolor' && COLORS.map((c) => (
              <Chip key={c} label={c} active={color === c} onPress={() => setColor(color === c ? undefined : c)} />
            ))}
            {open === 'Stan' && CONDITIONS.map((c) => (
              <Chip key={c.value} label={c.label} active={condition === c.value} onPress={() => setCondition(condition === c.value ? undefined : c.value)} />
            ))}
            {open === 'Cena' && PRICE_RANGES.map((r) => (
              <Chip key={r.key} label={r.label} active={priceKey === r.key} onPress={() => setPriceKey(priceKey === r.key ? undefined : r.key)} />
            ))}
          </View>

          <TouchableOpacity style={s.showBtn} onPress={() => setOpen(null)} activeOpacity={0.85}>
            <Text style={s.showBtnText}>Pokaż {total} {total === 1 ? 'wynik' : 'wyników'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Licznik + widok + sort */}
      <View style={s.toolbar}>
        <Text style={s.count}>{loading ? 'Ładowanie…' : `${total} ${total === 1 ? 'wynik' : 'wyników'}`}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.viewToggle}>
            <TouchableOpacity style={[s.viewBtn, view === 'grid' && s.viewBtnOn]} onPress={() => setView('grid')}><Icon name="grid" size={15} color={view === 'grid' ? C.gold : C.muted} /></TouchableOpacity>
            <TouchableOpacity style={[s.viewBtn, view === 'list' && s.viewBtnOn]} onPress={() => setView('list')}><Icon name="list" size={15} color={view === 'list' ? C.gold : C.muted} /></TouchableOpacity>
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => { setSortOpen((o) => !o); setOpen(null); }}>
            <Text style={s.sortText}>{SORTS.find((x) => x.key === sort)?.label}</Text>
            <Icon name="chevronDown" size={13} color={C.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {sortOpen && (
        <View style={s.sortMenu}>
          {SORTS.map((x) => (
            <TouchableOpacity key={x.key} style={[s.sortItem, x.key === sort && s.sortItemOn]} onPress={() => { setSort(x.key); setSortOpen(false); }}>
              <Text style={[s.sortItemText, x.key === sort && { color: C.ink, fontWeight: '700' }]}>{x.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Wyniki */}
      {loading && items.length === 0 ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <Text style={s.empty}>Brak wyników dla wybranych filtrów.</Text>
          {activeCount > 0 && <TouchableOpacity onPress={clearAll}><Text style={s.clearLink}>Wyczyść filtry</Text></TouchableOpacity>}
        </View>
      ) : view === 'grid' ? (
        <ProductGrid items={items} />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((p) => <ListRow key={p.id} p={p} onOpen={() => navigation.navigate('Produkt', { id: p.id })} />)}
        </View>
      )}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipOn]} onPress={onPress} activeOpacity={0.8}>
      {active && <Icon name="check" size={12} color="#fff" />}
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListRow({ p, onOpen }: { p: Listing; onOpen: () => void }) {
  return (
    <TouchableOpacity style={s.listRow} onPress={onOpen} activeOpacity={0.85}>
      {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={s.listImg} /> : <View style={s.listImg} />}
      <View style={{ flex: 1 }}>
        <Text style={s.listTitle} numberOfLines={1}>{p.title}</Text>
        {p.brand ? <Text style={s.listBrand}>{p.brand}</Text> : null}
        <View style={s.listCond}><Text style={s.listCondText}>{conditionLabel(p.condition)}</Text></View>
        <Text style={s.listPrice}>{grosze(p.price)}</Text>
        <Text style={s.listMeta} numberOfLines={1}>{p.size ?? 'Uniwersalny'}{p.color ? ` · ${p.color}` : ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  searchText: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  filterToggle: { width: 46, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  countDot: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  countDotText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  pills: { gap: 8, paddingVertical: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.surface },
  pillActive: { backgroundColor: C.goldSoft, borderColor: C.gold },
  pillOpen: { backgroundColor: C.ink, borderColor: C.ink },
  pillText: { fontSize: 13, fontWeight: '600', color: C.ink },

  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 4 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  clear: { fontSize: 12, fontWeight: '700', color: C.gold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  showBtn: { backgroundColor: C.gold, borderRadius: 999, paddingVertical: 11, alignItems: 'center', marginTop: 14 },
  showBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 14 },
  count: { fontSize: 13, color: C.muted },
  viewToggle: { flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, padding: 2 },
  viewBtn: { width: 30, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  viewBtnOn: { backgroundColor: C.goldSoft },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 13, color: C.ink, fontWeight: '600' },
  sortMenu: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 6, marginBottom: 12, marginTop: -6, alignSelf: 'flex-end', width: 200 },
  sortItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  sortItemOn: { backgroundColor: C.goldSoft },
  sortItemText: { fontSize: 13, color: C.inkSoft },

  empty: { color: C.muted, fontSize: 14, textAlign: 'center' },
  clearLink: { color: C.gold, fontSize: 14, fontWeight: '700', marginTop: 8 },

  listRow: { flexDirection: 'row', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12 },
  listImg: { width: 104, height: 112, borderRadius: 12, backgroundColor: C.goldSoft },
  listTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.ink },
  listBrand: { fontSize: 13, color: C.muted, marginTop: 2 },
  listCond: { alignSelf: 'flex-start', backgroundColor: 'rgba(242,233,213,0.5)', borderWidth: 1, borderColor: 'rgba(192,145,60,0.3)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: 6 },
  listCondText: { fontSize: 11, fontWeight: '700', color: C.goldDeep },
  listPrice: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginTop: 6 },
  listMeta: { fontSize: 12, color: C.muted, marginTop: 6 },
});
