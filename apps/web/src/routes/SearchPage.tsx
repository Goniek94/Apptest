'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { grosze, conditionLabel, type Listing } from '@modamarket/shared';
import { fetchListings } from '../lib/api/listings';
import { fetchCategoryTree, type CategoryTree } from '../lib/api/categories';
import { Icon } from '../components/ui/Icon';
import { ShopCard } from '../components/product/ProductCard';

/* ---- drzewo kategorii w filtrach (rozwijane, zaznaczanie na każdym poziomie) ---- */
function CatTree({ nodes, selected, onToggle, depth = 0 }: { nodes: CategoryTree[]; selected: string[]; onToggle: (slug: string) => void; depth?: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className={depth === 0 ? 'space-y-0.5' : 'space-y-0.5 ml-2.5 pl-2.5 border-l border-line mt-1'}>
      {nodes.map((node) => {
        const has = !!node.children?.length;
        const checked = selected.includes(node.slug);
        const isOpen = open[node.slug];
        return (
          <div key={node.id}>
            <div className="flex items-center gap-2 py-1">
              <button type="button" onClick={() => onToggle(node.slug)} aria-label="Zaznacz" className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold text-white' : 'border-line'}`}>{checked && <Icon name="check" size={11} />}</button>
              <button type="button" onClick={() => (has ? setOpen((o) => ({ ...o, [node.slug]: !o[node.slug] })) : onToggle(node.slug))} className="flex-1 flex items-center justify-between text-left text-[13px]">
                <span className={checked ? 'text-ink font-semibold' : 'text-ink-soft'}>{node.name}</span>
                {has && <Icon name="chevronDown" size={14} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
              </button>
            </div>
            {has && isOpen && <CatTree nodes={node.children!} selected={selected} onToggle={onToggle} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

/** slug → wszystkie slugi w poddrzewie (z samym sobą) — do filtrowania po kategorii i podkategoriach. */
function buildDescendants(nodes: CategoryTree[], map = new Map<string, string[]>()): Map<string, string[]> {
  for (const n of nodes) {
    const own: string[] = [n.slug];
    if (n.children?.length) {
      buildDescendants(n.children, map);
      for (const c of n.children) own.push(...(map.get(c.slug) ?? [c.slug]));
    }
    map.set(n.slug, own);
  }
  return map;
}

/** slug → nazwa (do chipsów wybranych filtrów). */
function buildNames(nodes: CategoryTree[], map = new Map<string, string>()): Map<string, string> {
  for (const n of nodes) {
    map.set(n.slug, n.name);
    if (n.children?.length) buildNames(n.children, map);
  }
  return map;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-line last:border-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <Icon name="chevronDown" size={15} className="text-muted" />
      </div>
      {children}
    </div>
  );
}

function Check({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 py-1 text-[13px] text-ink-soft cursor-pointer">
      <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-gold border-gold text-white' : 'border-line'}`}>
        {checked && <Icon name="check" size={11} />}
      </span>
      {label}
    </label>
  );
}

const COLORS = ['#1E1B16', '#6B4A2B', '#9A6B3F', '#C9A24B', '#F2E9D5', '#5B6650'];

const uniq = (arr: (string | undefined)[]) => [...new Set(arr.filter(Boolean) as string[])];
const SORTS = ['Trafność', 'Cena: rosnąco', 'Cena: malejąco', 'Najnowsze'];

function inPrice(priceGr: number, label: string) {
  const z = priceGr / 100;
  if (label === 'do 100 zł') return z < 100;
  if (label === '100–300 zł') return z >= 100 && z < 300;
  if (label === '300–700 zł') return z >= 300 && z < 700;
  if (label === '700 zł+') return z >= 700;
  return true;
}

/* ---- Mobile: karta wyniku ---- */
function MobileResult({ p }: { p: Listing }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/produkt/${p.id}`)} className="card-surface overflow-hidden shadow-[0_6px_20px_rgba(40,30,20,0.05)]">
      <div className="relative aspect-[4/5] bg-gold-soft bg-cover bg-center" style={{ backgroundImage: `url('${p.imageUrl}')` }}>
        <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold bg-white/90 text-ink px-2 py-1 rounded-pill shadow-sm">{conditionLabel(p.condition)}</span>
        <button onClick={(e) => e.stopPropagation()} className="absolute top-2.5 right-2.5 w-9 h-9 rounded-pill bg-white/95 flex items-center justify-center shadow-sm">
          <Icon name="heart" size={16} className="text-ink" />
        </button>
      </div>
      <div className="p-3 text-center">
        <div className="font-serif text-[15px] font-bold text-ink leading-tight truncate">{p.title}</div>
        <div className="text-[12px] text-muted mt-0.5">{p.brand}</div>
        <div className="font-serif text-[17px] font-bold text-ink mt-1.5">{grosze(p.price)}</div>
      </div>
    </div>
  );
}

const TIMES = ['Dzisiaj, 09:20', 'Wczoraj, 20:15', '2 dni temu', '3 dni temu', '4 dni temu', 'Tydzień temu'];

/* ---- Mobile: wiersz listy (karta) ---- */
function ListRow({ p, i }: { p: Listing; i: number }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/produkt/${p.id}`)} className="card-surface p-3 flex gap-3.5 shadow-[0_4px_16px_rgba(40,30,20,0.04)]">
      <div className="w-[104px] h-[112px] rounded-xl bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${p.imageUrl}')` }} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-serif text-[16px] font-semibold text-ink leading-tight truncate">{p.title}</div>
            <div className="text-[13px] text-muted mt-0.5">{p.brand}</div>
          </div>
          <button onClick={(e) => e.stopPropagation()} className="w-9 h-9 rounded-pill border border-line flex items-center justify-center shrink-0 hover:border-gold transition-colors"><Icon name="heart" size={16} className="text-ink" /></button>
        </div>
        <span className="self-start text-[11px] font-semibold text-gold-deep bg-gold-soft/50 border border-gold/30 px-2.5 py-0.5 rounded-pill mt-1.5">{conditionLabel(p.condition)}</span>
        <div className="font-serif text-[18px] font-bold text-ink mt-1.5">{grosze(p.price)}</div>
        <div className="flex items-center justify-between mt-auto pt-1.5 text-[12px] text-muted">
          <span className="truncate">{p.size ?? 'One size'}{p.color ? ` · ${p.color}` : ''}</span>
          <span className="shrink-0">{TIMES[i % TIMES.length]}</span>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const params = useSearchParams();

  // żywe dane z backendu
  const [items, setItems] = useState<Listing[]>([]);
  const [catTree, setCatTree] = useState<CategoryTree[]>([]);
  const [q, setQ] = useState(params.get('q') ?? '');

  useEffect(() => {
    fetchListings({ limit: 100, sort: 'newest' }).then((r) => setItems(r.items)).catch(() => {});
    fetchCategoryTree().then(setCatTree).catch(() => {});
  }, []);

  const descMap = useMemo(() => buildDescendants(catTree), [catTree]);
  const nameMap = useMemo(() => buildNames(catTree), [catTree]);

  // opcje filtrów (Kategoria = drzewo, reszta z realnych ogłoszeń)
  const GROUPS = useMemo<{ key: string; options: string[] }[]>(() => [
    { key: 'Kategoria', options: [] },
    { key: 'Rozmiar', options: uniq(items.map((p) => p.size)) },
    { key: 'Kolor', options: uniq(items.map((p) => p.color)) },
    { key: 'Stan', options: uniq(items.map((p) => conditionLabel(p.condition))) },
    { key: 'Cena', options: ['do 100 zł', '100–300 zł', '300–700 zł', '700 zł+'] },
  ], [items]);

  // stan filtrów mobilnych
  const [open, setOpen] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const cat = params.get('categorySlug');
    const init: Record<string, string[]> = {};
    if (cat) init.Kategoria = [cat];
    return init;
  });
  const [sort, setSort] = useState('Trafność');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const toggle = (group: string, value: string) =>
    setSel((prev) => {
      const cur = prev[group] ?? [];
      return { ...prev, [group]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  const activeCount = Object.values(sel).reduce((a, s) => a + s.length, 0);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = items.filter((p) => {
      if (needle && !(`${p.title} ${p.brand ?? ''}`.toLowerCase().includes(needle))) return false;
      for (const g of GROUPS) {
        const s = sel[g.key];
        if (!s || !s.length) continue;
        if (g.key === 'Kategoria' && !s.some((slug) => (descMap.get(slug) ?? [slug]).includes(p.categorySlug))) return false;
        if (g.key === 'Rozmiar' && !s.includes(p.size ?? '')) return false;
        if (g.key === 'Kolor' && !s.includes(p.color ?? '')) return false;
        if (g.key === 'Stan' && !s.includes(conditionLabel(p.condition))) return false;
        if (g.key === 'Cena' && !s.some((l) => inPrice(p.price, l))) return false;
      }
      return true;
    });
    if (sort === 'Cena: rosnąco') r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === 'Cena: malejąco') r = [...r].sort((a, b) => b.price - a.price);
    else if (sort === 'Najnowsze') r = [...r].sort((a, b) => b.id.localeCompare(a.id));
    return r;
  }, [items, sel, sort, q, GROUPS, descMap]);

  return (
    <div>
      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden px-4 pt-3">
        {/* szukaj */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-pill px-4 py-2.5">
            <Icon name="search" size={17} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj marek, produktów, stylów…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted" />
          </div>
          <button onClick={() => activeCount && setSel({})} className="relative w-11 rounded-pill bg-surface border border-line flex items-center justify-center text-ink shrink-0">
            <Icon name="sliders" size={18} />
            {activeCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-pill bg-gold text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>

        {/* pigułki filtrów */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {GROUPS.map((g) => {
            const n = sel[g.key]?.length ?? 0;
            const isOpen = open === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => { setOpen((o) => (o === g.key ? null : g.key)); setCatOpen(null); setSortOpen(false); }}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-[13px] font-medium border transition-colors touch-manipulation ${isOpen ? 'bg-ink border-ink text-white' : n > 0 ? 'bg-gold-soft border-gold text-ink' : 'bg-surface border-line text-ink'}`}
              >
                {g.key}{n > 0 && ` · ${n}`} <Icon name="chevronDown" size={14} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* rozwinięty panel opcji */}
        {open && (
          <div className="card-surface p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-ink">{open}</span>
              <div className="flex items-center gap-3">
                {(sel[open]?.length ?? 0) > 0 && <button onClick={() => setSel((p) => ({ ...p, [open]: [] }))} className="text-[12px] font-semibold text-gold">Wyczyść</button>}
                <button onClick={() => { setOpen(null); setCatOpen(null); }} aria-label="Zwiń" className="w-7 h-7 -mr-1 rounded-pill flex items-center justify-center text-muted hover:bg-bg"><Icon name="x" size={16} /></button>
              </div>
            </div>
            {open === 'Kategoria' ? (
              <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                {catTree.length ? (
                  <CatTree nodes={catTree} selected={sel['Kategoria'] ?? []} onToggle={(slug) => toggle('Kategoria', slug)} />
                ) : <span className="text-[12px] text-muted">Wczytywanie kategorii…</span>}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {GROUPS.find((g) => g.key === open)!.options.map((opt) => {
                  const checked = sel[open]?.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(open, opt)}
                      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] border transition-colors ${checked ? 'bg-ink text-white border-ink' : 'bg-surface text-ink-soft border-line'}`}
                    >
                      {checked && <Icon name="check" size={12} />}{opt}
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setOpen(null)} className="btn-gold w-full py-2.5 text-white text-sm mt-4">Pokaż {results.length} wyników</button>
          </div>
        )}

        {/* licznik + widok + sort */}
        <div className="flex items-center justify-between mt-3 mb-4 relative">
          <span className="text-[13px] text-muted">{results.length} wyników</span>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-surface border border-line rounded-pill p-0.5">
              <button onClick={() => setView('grid')} className={`w-7 h-7 rounded-pill flex items-center justify-center ${view === 'grid' ? 'bg-gold-soft text-gold' : 'text-muted'}`}><Icon name="grid" size={15} /></button>
              <button onClick={() => setView('list')} className={`w-7 h-7 rounded-pill flex items-center justify-center ${view === 'list' ? 'bg-gold-soft text-gold' : 'text-muted'}`}><Icon name="list" size={15} /></button>
            </div>
            <button onClick={() => { setSortOpen((o) => !o); setOpen(null); }} className="flex items-center gap-1 text-[13px] text-ink">
              {sort} <Icon name="chevronDown" size={14} className={`text-muted transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {sortOpen && (
            <div className="absolute right-0 top-8 z-20 w-48 card-surface p-1.5 shadow-lg">
              {SORTS.map((s) => (
                <button key={s} onClick={() => { setSort(s); setSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${s === sort ? 'bg-gold-soft text-ink font-semibold' : 'text-ink-soft hover:bg-bg'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* wyniki */}
        {results.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">Brak wyników dla wybranych filtrów.<br /><button onClick={() => setSel({})} className="text-gold font-semibold mt-2">Wyczyść filtry</button></div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {results.map((p) => <MobileResult key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((p, i) => <ListRow key={p.id} p={p} i={i} />)}
          </div>
        )}
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block w-full max-w-[1860px] mx-auto px-5 md:px-10 py-6">
        <div className="grid grid-cols-[260px_1fr] gap-8">
          <aside>
            <div className="card-surface p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-ink">Filtry</span>
                {activeCount > 0 && <button onClick={() => setSel({})} className="text-[12px] font-semibold text-gold">Wyczyść</button>}
              </div>
              {GROUPS.map((g) => (
                <FilterGroup key={g.key} title={g.key}>
                  {g.key === 'Kategoria' ? (
                    catTree.length ? (
                      <CatTree nodes={catTree} selected={sel['Kategoria'] ?? []} onToggle={(slug) => toggle('Kategoria', slug)} />
                    ) : <span className="text-[12px] text-muted">Wczytywanie…</span>
                  ) : (
                    <div className="space-y-0.5">
                      {g.options.length === 0 ? (
                        <span className="text-[12px] text-muted">Brak opcji</span>
                      ) : g.options.map((opt) => {
                        const checked = sel[g.key]?.includes(opt) ?? false;
                        return (
                          <button key={opt} onClick={() => toggle(g.key, opt)} className="flex items-center gap-2.5 py-1 text-[13px] text-ink-soft w-full text-left">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold text-white' : 'border-line'}`}>{checked && <Icon name="check" size={11} />}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </FilterGroup>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-ink mb-4">{q.trim() ? `Wyniki dla „${q.trim()}"` : 'Wszystkie ogłoszenia'}</h1>
            <div className="flex items-center gap-2.5 bg-surface border border-line rounded-pill px-5 py-3 mb-3">
              <Icon name="search" size={19} className="text-muted shrink-0" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj marek, produktów, stylów…" className="bg-transparent outline-none text-[15px] flex-1 placeholder:text-muted" />
              {q && <button onClick={() => setQ('')} aria-label="Wyczyść" className="text-muted hover:text-ink shrink-0"><Icon name="x" size={17} /></button>}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] text-muted">{results.length} {results.length === 1 ? 'wynik' : 'wyników'}</span>
                <span className="text-line">·</span>
                {activeCount === 0 ? (
                  <span className="text-[13px] text-muted">Wszystkie produkty</span>
                ) : (
                  <>
                    <span className="text-[13px] text-muted">Wybrane:</span>
                    {Object.entries(sel).flatMap(([g, vals]) => vals.map((v) => (
                      <span key={g + v} className="inline-flex items-center gap-1.5 bg-surface border border-line rounded-pill px-3 py-1.5 text-[12px] text-ink">
                        {g === 'Kategoria' ? (nameMap.get(v) ?? v) : v} <button onClick={() => toggle(g, v)} className="text-muted hover:text-danger"><Icon name="x" size={12} /></button>
                      </span>
                    )))}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink">
                <span className="text-muted">Sortuj:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-surface border border-line rounded-pill px-3 py-1.5 text-[13px] outline-none cursor-pointer">
                  {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 text-muted text-sm">Brak wyników dla wybranych filtrów.<br /><button onClick={() => setSel({})} className="text-gold font-semibold mt-2">Wyczyść filtry</button></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-10">
                {results.map((p) => <ShopCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
