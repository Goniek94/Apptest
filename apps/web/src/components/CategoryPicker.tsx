'use client';
import { useMemo, useState } from 'react';
import { Icon, type IconName } from './ui/Icon';
import type { CategoryTree } from '../lib/api/categories';

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
 * Pełnoekranowy wybór kategorii (jak na mobilce/Vinted): drill-down o dowolnej głębokości
 * (dział → kategoria → podkategoria). Wybór tylko na „liściu". Wyszukiwarka po wszystkich liściach.
 */
export function CategoryPicker({
  open, tree, selectedId, onClose, onSelect,
}: {
  open: boolean;
  tree: CategoryTree[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (path: CategoryTree[], leaf: CategoryTree) => void;
}) {
  const [stack, setStack] = useState<CategoryTree[]>([]);
  const [q, setQ] = useState('');

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

  if (!open) return null;

  const current = stack.length ? (stack[stack.length - 1].children ?? []) : tree;
  const atRoot = stack.length === 0;
  const title = stack.length ? stack[stack.length - 1].name : 'Kategoria';

  const reset = () => { setStack([]); setQ(''); };
  const close = () => { reset(); onClose(); };
  const back = () => { if (q) setQ(''); else if (stack.length) setStack((st) => st.slice(0, -1)); else close(); };
  const choose = (path: CategoryTree[], leaf: CategoryTree) => { reset(); onSelect(path, leaf); };
  const tap = (node: CategoryTree) => { if (isLeaf(node)) choose(stack, node); else setStack((st) => [...st, node]); };

  return (
    <div className="fixed inset-0 z-[70] bg-bg flex flex-col">
      {/* nagłówek */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-line bg-surface">
        <button onClick={back} className="w-9 h-9 flex items-center justify-center text-ink"><Icon name="arrowLeft" size={22} /></button>
        <h3 className="flex-1 text-center font-serif text-lg font-semibold text-ink truncate">{title}</h3>
        <button onClick={close} className="w-9 h-9 flex items-center justify-center text-muted"><Icon name="x" size={20} /></button>
      </div>

      {/* wyszukiwarka */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 bg-surface border border-line rounded-pill px-4 py-2.5">
          <Icon name="search" size={17} className="text-muted shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Wyszukaj kategorię" className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" />
        </div>
      </div>

      {/* lista */}
      <div className="flex-1 overflow-y-auto">
        {results ? (
          results.length === 0 ? (
            <p className="text-center text-sm text-muted mt-12">Brak wyników dla „{q}".</p>
          ) : (
            results.map(({ path, leaf }) => (
              <button key={leaf.id} onClick={() => choose(path, leaf)} className="w-full flex items-center gap-3.5 px-4 py-4 border-b border-line text-left">
                <div className="flex-1 min-w-0">
                  <div className={`text-[16px] ${leaf.id === selectedId ? 'text-gold font-semibold' : 'text-ink'}`}>{leaf.name}</div>
                  <div className="text-[12px] text-muted truncate">{path.map((p) => p.name).join(' › ')}</div>
                </div>
                {leaf.id === selectedId && <Icon name="check" size={18} className="text-gold shrink-0" />}
              </button>
            ))
          )
        ) : (
          current.map((node) => {
            const leaf = isLeaf(node);
            return (
              <button key={node.id} onClick={() => tap(node)} className="w-full flex items-center gap-3.5 px-4 py-4 border-b border-line text-left">
                {atRoot && <span className="w-10 h-10 rounded-pill bg-gold-soft text-gold flex items-center justify-center shrink-0"><Icon name={PARENT_ICON[node.slug] ?? 'tag'} size={19} /></span>}
                <span className={`flex-1 text-[16px] ${node.id === selectedId ? 'text-gold font-semibold' : 'text-ink'}`}>{node.name}</span>
                {leaf ? (node.id === selectedId ? <Icon name="check" size={18} className="text-gold" /> : null) : <Icon name="chevronRight" size={18} className="text-muted" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
