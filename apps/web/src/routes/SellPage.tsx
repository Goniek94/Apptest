'use client';
import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { grosze, type ItemCondition } from '@modamarket/shared';
import { Icon, type IconName } from '../components/ui/Icon';
import { AccountLayout } from '../components/layout/AccountLayout';
import { fetchCategoryTree, type CategoryTree } from '../lib/api/categories';
import { createListing, uploadListingImage } from '../lib/api/listings';
import { CategoryPicker } from '../components/CategoryPicker';
import { useCurrentUser, openAuth } from '../lib/auth';

const STEPS = ['Zdjęcia', 'Szczegóły', 'Cena i dostawa', 'Podsumowanie'];
const STANY = ['Nowy z metką', 'Nowy bez metki', 'Bardzo dobry', 'Dobry', 'Zadowalający'];
const COND_MAP: Record<string, ItemCondition> = {
  'Nowy z metką': 'NEW',
  'Nowy bez metki': 'LIKE_NEW',
  'Bardzo dobry': 'VERY_GOOD',
  'Dobry': 'GOOD',
  'Zadowalający': 'GOOD',
};
const BRANDS = ['Zara', 'H&M', 'Nike', 'Adidas', 'New Balance', 'Mango', 'Gucci', 'Reserved', 'Inna'];
const COLORS = ['Beżowy', 'Czarny', 'Biały', 'Czerwony', 'Niebieski', 'Zielony', 'Brązowy', 'Szary'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '38', '40', '42', '44'];

function Label({ children, req }: { children: ReactNode; req?: boolean }) {
  return <span className="block text-sm font-medium text-ink mb-2">{children}{req && <span className="text-gold"> *</span>}</span>;
}

function Select({ label, placeholder, req, options, value, onChange, swatchColor }: { label: string; placeholder: string; req?: boolean; options?: string[]; value: string; onChange: (v: string) => void; swatchColor?: string }) {
  const opts = options ?? ['Opcja A', 'Opcja B'];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Label req={req}>{label}</Label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="input-base flex items-center justify-between gap-2 flex-1 text-left">
          <span className={`truncate ${value ? 'text-ink' : 'text-muted'}`}>{value || placeholder}</span>
          <Icon name="chevronDown" size={16} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {swatchColor && <div className="w-12 rounded-lg border border-line shrink-0" style={{ background: swatchColor }} />}
      </div>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Zamknij" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1.5 card-surface p-1.5 shadow-[0_16px_40px_rgba(40,30,20,0.14)] max-h-60 overflow-y-auto">
            {opts.map((o) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${o === value ? 'bg-gold-soft text-ink font-semibold' : 'text-ink-soft hover:bg-bg'}`}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-pill flex items-center justify-center text-sm font-semibold ${done ? 'btn-gold text-white' : 'bg-surface border border-line text-muted'}`}>{i + 1}</div>
              <span className={`mt-2 text-[13px] whitespace-nowrap ${done ? 'text-ink font-medium' : 'text-muted'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 mb-6 ${i < current ? 'bg-gold' : 'bg-line'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`w-11 h-6 rounded-pill p-0.5 shrink-0 transition-colors ${on ? 'bg-gold' : 'bg-line'}`}>
      <span className={`block w-5 h-5 rounded-pill bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

/* Wiersz-select (mobile): kontrolowany */
function RowSelect({ icon, label, placeholder, options, value, onChange }: { icon: IconName; label: string; placeholder: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 border border-line rounded-xl px-3.5 py-3 bg-surface text-left">
        <Icon name={icon} size={18} className="text-ink-soft shrink-0" />
        <span className="text-[14px] text-ink leading-tight">{label}</span>
        <span className={`ml-auto pl-2 text-[13px] text-right truncate max-w-[55%] ${value ? 'text-ink font-medium' : 'text-muted'}`}>{value || placeholder}</span>
        <Icon name="chevronDown" size={16} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Zamknij" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1.5 card-surface p-1.5 shadow-[0_16px_40px_rgba(40,30,20,0.14)] max-h-60 overflow-y-auto">
            {options.map((o) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${o === value ? 'bg-gold-soft text-ink font-semibold' : 'text-ink-soft hover:bg-bg'}`}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Spłaszcza drzewo kategorii do liści ze ścieżką (label) i id. */
function flattenLeaves(tree: CategoryTree[]): { label: string; id: string }[] {
  const out: { label: string; id: string }[] = [];
  const walk = (node: CategoryTree, path: string[]) => {
    const p = [...path, node.name];
    if (!node.children || node.children.length === 0) out.push({ label: p.join(' › '), id: node.id });
    else node.children.forEach((c) => walk(c, p));
  };
  tree.forEach((n) => walk(n, []));
  return out;
}

export function SellPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  // wspólny stan formularza (mobile + desktop)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [conditionLbl, setConditionLbl] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [negotiate, setNegotiate] = useState(false);
  const [protection, setProtection] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [cats, setCats] = useState<{ label: string; id: string }[]>([]);
  const [catTree, setCatTree] = useState<CategoryTree[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false); // pełnoekranowy picker (tylko widok mobilny)
  useEffect(() => {
    fetchCategoryTree().then((t) => { setCatTree(t); setCats(flattenLeaves(t)); }).catch(() => {});
  }, []);
  const catOptions = useMemo(() => cats.map((c) => c.label), [cats]);
  const categoryId = cats.find((c) => c.label === categoryLabel)?.id ?? '';

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = '';
  };
  const removePhoto = (i: number) => setFiles((ps) => ps.filter((_, j) => j !== i));

  async function publish() {
    if (!user) { openAuth('login'); return; }
    setError('');
    if (title.trim().length < 3) return setError('Podaj tytuł (min. 3 znaki).');
    const priceGrosze = Math.round(parseFloat(price.replace(',', '.')) * 100);
    if (!priceGrosze || priceGrosze <= 0 || Number.isNaN(priceGrosze)) return setError('Podaj poprawną cenę.');
    if (!categoryId) return setError('Wybierz kategorię.');

    setBusy(true);
    try {
      const created = await createListing({
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceGrosze,
        brand: brand || undefined,
        size: size || undefined,
        color: color || undefined,
        condition: COND_MAP[conditionLbl] ?? 'GOOD',
        negotiable: negotiate,
        categoryId,
      });
      for (const f of files) {
        try { await uploadListingImage(created.id, f); } catch { /* pomiń pojedyncze nieudane zdjęcie */ }
      }
      router.push(`/produkt/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się opublikować ogłoszenia.');
      setBusy(false);
    }
  }

  return (
    <AccountLayout active="dodaj">
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

      {/* Pełnoekranowy picker kategorii — jak w aplikacji mobilnej (drill-down). Tylko widok mobilny. */}
      <CategoryPicker
        open={pickerOpen}
        tree={catTree}
        selectedId={categoryId}
        onClose={() => setPickerOpen(false)}
        onSelect={(path, leaf) => {
          setCategoryLabel([...path, leaf].map((p) => p.name).join(' › '));
          setPickerOpen(false);
        }}
      />

      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden -mt-2">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="text-ink"><Icon name="arrowLeft" size={20} /></button>
          <h1 className="font-serif text-lg font-semibold text-ink flex-1 text-center pr-6">Dodaj ogłoszenie</h1>
        </div>

        {/* Zdjęcia */}
        <span className="block text-sm font-semibold text-ink mb-2">Zdjęcia</span>
        <div className="flex flex-wrap gap-2.5 mb-6">
          <button onClick={() => fileRef.current?.click()} className="w-[84px] h-[84px] rounded-xl border-2 border-dashed border-gold/50 bg-gold-soft/40 flex flex-col items-center justify-center text-center shrink-0">
            <Icon name="camera" size={20} className="text-gold mb-1" />
            <span className="text-[10px] font-semibold text-ink leading-tight">Dodaj zdjęcia</span>
            <span className="text-[9px] text-muted">Maks. 10 zdjęć</span>
          </button>
          {previews.map((src, i) => (
            <div key={i} className="relative w-[84px] h-[84px] rounded-xl bg-gold-soft bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${src}')` }}>
              <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-pill bg-ink text-white flex items-center justify-center shadow"><Icon name="x" size={11} /></button>
            </div>
          ))}
        </div>

        {/* Tytuł */}
        <span className="block text-sm font-semibold text-ink mb-2">Tytuł</span>
        <div className="input-base flex items-center gap-2 mb-5">
          <Icon name="tag" size={17} className="text-muted shrink-0" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" placeholder="Wpisz tytuł ogłoszenia" />
        </div>

        {/* Opis */}
        <span className="block text-sm font-semibold text-ink mb-2">Opis</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
          rows={3}
          className="input-base resize-none overflow-hidden min-h-[96px] mb-6"
          placeholder="Opisz produkt, jego stan, wymiary, materiał, itp."
        />

        {/* Cena */}
        <span className="block text-sm font-semibold text-ink mb-2">Cena</span>
        <div className="relative flex items-center mb-3">
          <input value={price} onChange={(e) => setPrice(e.target.value)} className="input-base pr-10" inputMode="decimal" placeholder="Wpisz cenę" />
          <span className="absolute right-4 text-sm text-muted">zł</span>
        </div>
        <label className="flex items-center justify-between mb-6 cursor-pointer">
          <span className="text-sm text-ink-soft">Cena do negocjacji</span>
          <Toggle on={negotiate} onChange={setNegotiate} />
        </label>

        {/* Pola szczegółów */}
        <div className="space-y-2.5">
          <button type="button" onClick={() => setPickerOpen(true)} className="w-full flex items-center gap-3 border border-line rounded-xl px-3.5 py-3 bg-surface text-left">
            <Icon name="grid" size={18} className="text-ink-soft shrink-0" />
            <span className="text-[14px] text-ink leading-tight">Kategoria</span>
            <span className={`ml-auto pl-2 text-[13px] text-right truncate max-w-[55%] ${categoryLabel ? 'text-ink font-medium' : 'text-muted'}`}>{categoryLabel ? categoryLabel.split(' › ').pop() : 'Wybierz kategorię'}</span>
            <Icon name="chevronRight" size={16} className="text-muted shrink-0" />
          </button>
          <RowSelect icon="tag" label="Marka" placeholder="Wybierz markę" options={BRANDS} value={brand} onChange={setBrand} />
          <RowSelect icon="shield" label="Stan" placeholder="Wybierz stan" options={STANY} value={conditionLbl} onChange={setConditionLbl} />
          <RowSelect icon="image" label="Kolor" placeholder="Wybierz kolor" options={COLORS} value={color} onChange={setColor} />
          <RowSelect icon="hanger" label="Rozmiar" placeholder="Wybierz rozmiar" options={SIZES} value={size} onChange={setSize} />
        </div>

        {/* Ochrona kupujących */}
        <div className="flex items-center gap-2 bg-gold-soft/40 border border-line rounded-xl px-3.5 py-3 mt-4">
          <Icon name="shield" size={18} className="text-gold shrink-0" />
          <span className="flex-1 text-[13px] text-ink-soft">Chcę sprzedać z Ochroną Kupujących</span>
          <Toggle on={protection} onChange={setProtection} />
        </div>

        {error && <p className="text-sm text-red-600 mt-4 text-center whitespace-pre-line">{error}</p>}
        <button onClick={publish} disabled={busy} className="btn-gold w-full py-3.5 text-white font-semibold mt-6 mb-2 disabled:opacity-60">{busy ? 'Publikowanie…' : 'Opublikuj'}</button>
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block">
        <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink mb-7">Dodaj nowe ogłoszenie</h1>

        <div className="card-surface px-6 md:px-10 py-6 mb-6">
          <Stepper current={0} />
        </div>

        <div className="card-surface p-6 md:p-7 mb-6 grid lg:grid-cols-2 gap-7">
          {/* Zdjęcia */}
          <div>
            <h2 className="font-serif text-[17px] font-semibold text-ink mb-4">Zdjęcia produktu</h2>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-line hover:border-gold transition-colors bg-bg/40 flex flex-col items-center justify-center text-center py-10 px-4"
            >
              <span className="w-12 h-12 rounded-pill bg-gold-soft text-gold flex items-center justify-center mb-3"><Icon name="bag" size={22} /></span>
              <span className="text-sm font-semibold text-ink">Kliknij, aby dodać zdjęcia</span>
              <span className="text-xs text-muted mt-2">JPG, PNG do 10 MB (max. 10 zdjęć)</span>
            </button>
            <div className="flex flex-wrap gap-3 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative w-[72px] h-[72px] rounded-lg bg-gold-soft bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }}>
                  <button onClick={() => removePhoto(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-pill bg-surface border border-line text-ink flex items-center justify-center shadow-sm"><Icon name="x" size={11} /></button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} className="w-[72px] h-[72px] rounded-lg border border-dashed border-line hover:border-gold flex items-center justify-center text-muted transition-colors">
                <Icon name="plus" size={18} />
              </button>
            </div>
          </div>

          {/* Szczegóły */}
          <div>
            <h2 className="font-serif text-[17px] font-semibold text-ink mb-4">Szczegóły produktu</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <Label req>Nazwa produktu</Label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" placeholder="Np. Płaszcz wełniany oversize" />
              </label>
              <Select label="Kategoria" placeholder="Wybierz kategorię" req options={catOptions} value={categoryLabel} onChange={setCategoryLabel} />
              <Select label="Marka" placeholder="Wybierz markę" options={BRANDS} value={brand} onChange={setBrand} />
              <Select label="Rozmiar" placeholder="Wybierz rozmiar" options={SIZES} value={size} onChange={setSize} />
              <Select label="Kolor" placeholder="Wybierz kolor" options={COLORS} value={color} onChange={setColor} />
            </div>

            <div className="mt-4">
              <Label req>Stan produktu</Label>
              <div className="flex flex-wrap gap-2">
                {STANY.map((s) => (
                  <button
                    key={s}
                    onClick={() => setConditionLbl(s)}
                    className={`text-[13px] font-medium px-4 py-2 rounded-pill border transition-colors ${conditionLbl === s ? 'bg-gold-soft border-gold text-ink' : 'bg-surface border-line text-ink-soft hover:border-gold'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="block mt-4">
              <Label req>Opis</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                className="input-base h-32 resize-none"
                placeholder="Opisz produkt, jego stan, materiał, dopasowanie i inne istotne informacje…"
              />
              <span className="block text-right text-[11px] text-muted mt-1">{description.length} / 2000</span>
            </label>
          </div>
        </div>

        {/* Cena + Podgląd */}
        <div className="card-surface p-6 md:p-7 mb-6 grid lg:grid-cols-3 gap-7">
          <div>
            <h2 className="font-serif text-[17px] font-semibold text-ink mb-4">Cena</h2>
            <label className="block">
              <Label req>Cena</Label>
              <div className="relative flex items-center">
                <input value={price} onChange={(e) => setPrice(e.target.value)} className="input-base pr-10" inputMode="decimal" placeholder="0,00" />
                <span className="absolute right-4 text-sm text-muted">zł</span>
              </div>
            </label>
            <label className="flex items-center justify-between mt-3 cursor-pointer">
              <span className="text-sm text-ink-soft">Cena do negocjacji</span>
              <Toggle on={negotiate} onChange={setNegotiate} />
            </label>
          </div>

          <div>
            <h2 className="font-serif text-[17px] font-semibold text-ink mb-4">Ochrona</h2>
            <label className="flex items-center justify-between cursor-pointer border border-line rounded-xl px-3.5 py-3">
              <span className="text-sm text-ink-soft flex items-center gap-2"><Icon name="shield" size={16} className="text-gold" /> Ochrona Kupujących</span>
              <Toggle on={protection} onChange={setProtection} />
            </label>
          </div>

          <div>
            <h2 className="font-serif text-[17px] font-semibold text-ink mb-4">Podgląd ogłoszenia</h2>
            <div className="flex gap-3">
              <div className="w-16 h-20 rounded-lg bg-gold-soft bg-cover bg-center shrink-0" style={previews[0] ? { backgroundImage: `url('${previews[0]}')` } : undefined} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink leading-snug">{title || 'Tytuł ogłoszenia'}</div>
                <div className="text-xs text-muted mt-0.5">{brand || 'Marka'}</div>
                <div className="text-xs text-muted">{size || 'Rozmiar'} · {conditionLbl || 'Stan'}</div>
                <div className="font-serif text-base font-bold text-ink mt-1">{grosze(Math.round((parseFloat(price.replace(',', '.')) || 0) * 100))}</div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4 text-right whitespace-pre-line">{error}</p>}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-8">
          <button onClick={publish} disabled={busy} className="btn-gold px-7 py-3 text-white disabled:opacity-60">
            {busy ? 'Publikowanie…' : 'Opublikuj ogłoszenie'} <Icon name="arrowRight" size={17} />
          </button>
        </div>

        <div className="border-t border-line pt-6 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[13px] text-muted">
          {([
            { i: 'shield', t: 'Bezpieczne transakcje' },
            { i: 'check', t: 'Zweryfikowani sprzedawcy' },
            { i: 'lock', t: 'Ochrona kupujących' },
            { i: 'help', t: 'Wsparcie 24/7' },
          ] as { i: IconName; t: string }[]).map((b) => (
            <span key={b.t} className="flex items-center gap-2"><span className="text-gold"><Icon name={b.i} size={16} /></span>{b.t}</span>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
}
