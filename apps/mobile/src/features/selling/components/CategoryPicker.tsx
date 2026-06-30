import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import type { CategoryTree } from '@/features/catalog/api/categories';

const PARENT_ICON: Record<string, IconName> = {
  'odziez-damska': 'hanger',
  'odziez-meska': 'user',
  'odziez-dziecieca': 'heart',
  obuwie: 'box',
  torebki: 'bag',
  akcesoria: 'star',
  bizuteria: 'crown',
};

const isLeaf = (n: CategoryTree) => !n.children || n.children.length === 0;

/**
 * Pełnoekranowy wybór kategorii (jak Vinted): drill-down o dowolnej głębokości
 * (główne → podkategorie → pod-podkategorie). Wybór możliwy tylko na „liściu".
 * Wyszukiwarka przeszukuje wszystkie liście i pokazuje pełną ścieżkę.
 */
export function CategoryPicker({
  visible, tree, selectedId, onClose, onSelect,
}: {
  visible: boolean;
  tree: CategoryTree[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (path: CategoryTree[], leaf: CategoryTree) => void;
}) {
  const insets = useSafeAreaInsets();
  const [stack, setStack] = useState<CategoryTree[]>([]);
  const [q, setQ] = useState('');

  const current = stack.length ? (stack[stack.length - 1].children ?? []) : tree;
  const atRoot = stack.length === 0;
  const title = stack.length ? stack[stack.length - 1].name : 'Kategoria';

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return null;
    const out: { path: CategoryTree[]; leaf: CategoryTree }[] = [];
    const walk = (nodes: CategoryTree[], path: CategoryTree[]) => {
      for (const n of nodes) {
        if (!isLeaf(n)) walk(n.children!, [...path, n]);
        else if ([...path, n].map((x) => x.name).join(' ').toLowerCase().includes(needle)) out.push({ path, leaf: n });
      }
    };
    walk(tree, []);
    return out;
  }, [q, tree]);

  const reset = () => { setStack([]); setQ(''); };
  const close = () => { reset(); onClose(); };
  const back = () => { if (q) setQ(''); else if (stack.length) setStack((s) => s.slice(0, -1)); else close(); };
  const choose = (path: CategoryTree[], leaf: CategoryTree) => { reset(); onSelect(path, leaf); };

  const tap = (node: CategoryTree) => {
    if (isLeaf(node)) choose(stack, node);
    else setStack((s) => [...s, node]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back}>
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={back} hitSlop={10} style={s.headerBtn}><Icon name="arrowLeft" size={22} color={C.ink} /></TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={close} hitSlop={10} style={s.headerBtn}><Icon name="x" size={20} color={C.muted} /></TouchableOpacity>
        </View>

        <View style={s.searchWrap}>
          <View style={s.search}>
            <Icon name="search" size={17} color={C.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Wyszukaj kategorię" placeholderTextColor={C.muted} style={s.searchInput} />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          {results ? (
            results.length === 0 ? (
              <Text style={s.empty}>Brak wyników dla „{q}".</Text>
            ) : (
              results.map(({ path, leaf }) => (
                <TouchableOpacity key={leaf.id} style={s.row} onPress={() => choose(path, leaf)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowText, leaf.id === selectedId && s.rowTextActive]}>{leaf.name}</Text>
                    <Text style={s.rowSub}>{path.map((p) => p.name).join(' › ')}</Text>
                  </View>
                  {leaf.id === selectedId && <Icon name="check" size={18} color={C.gold} />}
                </TouchableOpacity>
              ))
            )
          ) : (
            current.map((node) => {
              const leaf = isLeaf(node);
              return (
                <TouchableOpacity key={node.id} style={s.row} onPress={() => tap(node)} activeOpacity={0.7}>
                  {atRoot && <View style={s.parentIcon}><Icon name={PARENT_ICON[node.slug] ?? 'tag'} size={19} color={C.gold} /></View>}
                  <Text style={[s.rowText, { flex: 1 }, node.id === selectedId && s.rowTextActive]}>{node.name}</Text>
                  {leaf
                    ? (node.id === selectedId ? <Icon name="check" size={18} color={C.gold} /> : null)
                    : <Icon name="chevronRight" size={18} color={C.muted} />}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink },
  searchWrap: { padding: 16, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  parentIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 16, color: C.ink },
  rowTextActive: { color: C.gold, fontWeight: '700' },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  empty: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 40 },
});
