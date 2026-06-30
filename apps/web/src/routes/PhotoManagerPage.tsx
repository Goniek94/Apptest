'use client';
import { useRouter } from 'next/navigation';
import { IMG } from '@modamarket/shared';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui';

export function PhotoManagerPage() {
  const router = useRouter();
  const gallery = [IMG.trench, IMG.blazer, IMG.dressW, IMG.trench];

  return (
    <div className="max-w-[760px] mx-auto px-4 pt-4 md:pt-6 pb-8">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()}><Icon name="arrowLeft" size={20} /></button>
        <h1 className="font-serif text-xl font-semibold text-ink flex-1 text-center pr-6">Zdjęcia produktu</h1>
      </div>
      <p className="text-center text-sm text-muted mb-5">Dodaj i zarządzaj zdjęciami swojej oferty.</p>

      {/* Zdjęcie główne */}
      <div className="relative rounded-xl overflow-hidden bg-gold-soft aspect-[4/3] mb-2">
        <img src={IMG.trench} alt="" className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide text-gold bg-white/90 px-2 py-1 rounded-pill">ZDJĘCIE GŁÓWNE</span>
        <span className="absolute top-3 right-3 w-9 h-9 rounded-pill bg-gold text-white flex items-center justify-center"><Icon name="crown" size={18} /></span>
      </div>

      <span className="block text-[11px] font-bold tracking-wide text-muted mb-2">GALERIA ZDJĘĆ (przeciągnij, aby zmienić kolejność)</span>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {gallery.map((src, i) => (
          <div key={i} className="space-y-1">
            <div className={`relative rounded-lg overflow-hidden aspect-square bg-gold-soft ${i === 0 ? 'ring-2 ring-gold' : ''}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button className="absolute top-1 right-1 w-5 h-5 rounded-pill bg-white/90 flex items-center justify-center"><Icon name="x" size={11} /></button>
            </div>
            <div className="flex justify-center text-muted"><Icon name="grid" size={12} /></div>
          </div>
        ))}
      </div>

      <button className="w-full border border-dashed border-line rounded-lg py-4 flex flex-col items-center gap-1 text-ink mb-3">
        <span className="text-gold"><Icon name="plus" size={20} /></span>
        <span className="text-sm font-medium">Dodaj zdjęcia</span>
        <span className="text-[11px] text-muted">Przeciągnij i upuść lub wybierz z galerii</span>
      </button>

      <p className="text-[11px] text-muted text-center leading-relaxed mb-5">
        Obsługiwane formaty: JPG, PNG, WebP. Maks. 10 zdjęć.<br />Zalecana rozdzielczość: min. 1200 px po dłuższym boku.
      </p>

      <Button variant="gold" full icon="check" onClick={() => router.back()}>Gotowe</Button>
      <button onClick={() => router.back()} className="w-full text-center text-gold font-semibold text-sm mt-3">Anuluj</button>
    </div>
  );
}
