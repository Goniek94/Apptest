import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { type ItemCondition } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchCategoryTree, type CategoryTree } from '@/features/catalog/api/categories';
import { CategoryPicker } from '@/features/selling/components/CategoryPicker';
import { BRANDS } from '@/features/selling/brands';
import {
  updateListing,
  uploadListingImage,
  deleteListingImage,
  setListingImageCover,
  type PickedImage,
  type ApiListing,
} from '@/features/catalog/api/listings';
import type { ListingDraft } from '@/features/selling/types';

const STAN: Record<string, ItemCondition> = {
  'Nowy z metką': 'NEW',
  'Nowy bez metki': 'LIKE_NEW',
  'Bardzo dobry': 'VERY_GOOD',
  Dobry: 'GOOD',
  Zadowalający: 'GOOD',
};
const COLORS = [
  'Czarny', 'Biały', 'Kremowy', 'Szary', 'Beżowy', 'Brązowy', 'Granatowy', 'Niebieski',
  'Błękitny', 'Turkusowy', 'Zielony', 'Khaki', 'Oliwkowy', 'Miętowy', 'Żółty', 'Musztardowy',
  'Pomarańczowy', 'Czerwony', 'Bordowy', 'Różowy', 'Fuksja', 'Fioletowy', 'Liliowy', 'Złoty',
  'Srebrny', 'Wielokolorowy',
];
const MAX_COLORS = 2;
const MATERIALS = [
  'Bawełna', 'Bawełna organiczna', 'Poliester', 'Wełna', 'Wełna merino', 'Kaszmir', 'Akryl',
  'Wiskoza', 'Elastan', 'Nylon', 'Poliamid', 'Len', 'Jedwab', 'Jeans / Denim', 'Skóra naturalna',
  'Skóra ekologiczna', 'Zamsz', 'Nubuk', 'Futro naturalne', 'Futro sztuczne', 'Koronka', 'Tiul',
  'Szyfon', 'Satyna', 'Welur', 'Sztruks', 'Flanela', 'Dzianina', 'Tweed', 'Neopren', 'Guma',
  'Tekstylia', 'Inny',
];

// Rozmiary zależne od kategorii: ubrania (litery), buty (numery), dzieci (cm), akcesoria (uniwersalny).
const SIZES_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '34', '36', '38', '40', '42', '44', '46'];
const SIZES_SHOES = Array.from({ length: 48 - 35 + 1 }, (_, i) => String(35 + i));
const SIZES_KIDS = ['56', '62', '68', '74', '80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152', '158', '164'];
const SIZES_UNIVERSAL = ['Uniwersalny'];

function sizesFor(topSlug: string): string[] {
  if (topSlug === 'obuwie') return SIZES_SHOES;
  if (topSlug === 'odziez-dziecieca') return SIZES_KIDS;
  if (topSlug === 'akcesoria' || topSlug === 'torebki' || topSlug === 'bizuteria') return SIZES_UNIVERSAL;
  return SIZES_CLOTHING;
}

/** Ścieżka od korzenia do węzła o danym id (włącznie) — do etykiety i rozmiarówki. */
function findPath(nodes: CategoryTree[], id: string, trail: CategoryTree[] = []): CategoryTree[] | null {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.id === id) return next;
    if (n.children?.length) {
      const r = findPath(n.children, id, next);
      if (r) return r;
    }
  }
  return null;
}

type SelectedCategory = { id: string; name: string; parentPath: string; topSlug: string };

/** Dodaj ogłoszenie — formularz z podkategorią, 2 kolorami i wymiarami; „Przejdź do podglądu". */
export function SellScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const edit = route.params?.edit as ApiListing | undefined;
  const isEdit = !!edit;

  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [stan, setStan] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [category, setCategory] = useState<SelectedCategory | null>(null);
  const [negotiate, setNegotiate] = useState(false);
  const [unisex, setUnisex] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [groupBuy, setGroupBuy] = useState(false);
  const isBusiness = user?.accountType === 'BUSINESS';
  const [protection, setProtection] = useState(true);
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [photosW, setPhotosW] = useState(0);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const prefilled = useRef(false);

  // Responsywne kafelki: dopasuj rozmiar tak, by równo wypełniły wiersz (więcej na szerszym ekranie).
  const PHOTO_GAP = 10;
  const photoCols = photosW > 0 ? Math.max(4, Math.round(photosW / 88)) : 4;
  const photoTile = photosW > 0 ? Math.floor((photosW - PHOTO_GAP * (photoCols - 1)) / photoCols) : 84;

  useEffect(() => {
    fetchCategoryTree().then(setTree).catch(() => {});
  }, []);

  // Tryb edycji: wypełnij formularz danymi oferty (po wczytaniu drzewa kategorii).
  useEffect(() => {
    if (!edit || prefilled.current || tree.length === 0) return;
    prefilled.current = true;
    setTitle(edit.title);
    setDesc(edit.description ?? '');
    setPrice(String(edit.price / 100).replace('.', ','));
    if (edit.brand && BRANDS.includes(edit.brand)) setBrand(edit.brand);
    else if (edit.brand) { setBrand('Inna'); setCustomBrand(edit.brand); }
    const stanLabel = Object.keys(STAN).find((k) => STAN[k] === edit.condition);
    if (stanLabel) setStan(stanLabel);
    setSize(edit.size ?? '');
    setMaterial(edit.material ?? '');
    setColors(edit.color ? edit.color.split(',').map((c) => c.trim()).filter(Boolean).slice(0, 2) : []);
    setWidth(edit.widthCm ? String(edit.widthCm) : '');
    setLength(edit.lengthCm ? String(edit.lengthCm) : '');
    setNegotiate(edit.negotiable !== false);
    setUnisex(!!edit.unisex);
    setQuantity(String(edit.quantity ?? 1));
    setGroupBuy(!!edit.groupBuy);
    if (edit.category) {
      const path = findPath(tree, edit.category.id);
      if (path) {
        const leaf = path[path.length - 1];
        setCategory({ id: leaf.id, name: leaf.name, parentPath: path.slice(0, -1).map((p) => p.name).join(' › '), topSlug: path[0].slug });
      }
    }
    setExistingImages(edit.images.map((i) => ({ id: i.id, url: i.url })));
  }, [edit, tree]);

  const removeExisting = (id: string) => {
    setRemovedIds((r) => [...r, id]);
    setExistingImages((xs) => xs.filter((x) => x.id !== id));
  };

  // Ustaw istniejące zdjęcie jako główne — optymistycznie na początek + zapis kolejności na serwerze.
  const setExistingCover = async (id: string) => {
    setExistingImages((xs) => {
      const idx = xs.findIndex((x) => x.id === id);
      if (idx <= 0) return xs;
      const c = [...xs];
      const [m] = c.splice(idx, 1);
      return [m, ...c];
    });
    try {
      await setListingImageCover(id);
    } catch {
      Alert.alert('Błąd', 'Nie udało się ustawić zdjęcia jako głównego.');
    }
  };

  const sizeOptions = sizesFor(category?.topSlug ?? '');

  // Zmiana kategorii na inny typ rozmiarów (np. ubrania → buty) — czyścimy nieprawidłowy rozmiar.
  useEffect(() => {
    if (size && !sizesFor(category?.topSlug ?? '').includes(size)) setSize('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.topSlug]);

  const toggleColor = (c: string) =>
    setColors((cs) =>
      cs.includes(c) ? cs.filter((x) => x !== c) : cs.length >= MAX_COLORS ? cs : [...cs, c],
    );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Brak dostępu', 'Zezwól na dostęp do zdjęć, aby dodać foto.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (res.canceled) return;
    const picked: PickedImage[] = res.assets.map((a) => ({ uri: a.uri, name: a.fileName ?? undefined, type: a.mimeType ?? undefined }));
    setPhotos((ps) => [...ps, ...picked].slice(0, 10));
    clearErr('photos');
  };
  const removePhotoByKey = (uri: string) => setPhotos((ps) => ps.filter((p) => p.uri !== uri));
  // Ustaw jako okładkę — przenosi zdjęcie na początek (pierwsze = główne).
  const setMain = (i: number) =>
    setPhotos((ps) => {
      if (i === 0) return ps;
      const copy = [...ps];
      const [m] = copy.splice(i, 1);
      return [m, ...copy];
    });

  // Walidacja formularza — zwraca mapę błędów (puste = OK). Wspólna dla podglądu i zapisu.
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const totalPhotos = existingImages.length + photos.length;
    const priceGrosze = Math.round(parseFloat(price.replace(',', '.')) * 100);
    if (totalPhotos < 1) e.photos = 'Dodaj co najmniej 1 zdjęcie.';
    if (title.trim().length < 3) e.title = 'Tytuł musi mieć min. 3 znaki.';
    if (!price.trim()) e.price = 'Podaj cenę.';
    else if (!Number.isFinite(priceGrosze) || priceGrosze < 1) e.price = 'Podaj poprawną cenę.';
    else if (priceGrosze > 9_999_999) e.price = 'Maksymalna cena to 99 999,99 zł.';
    if (!category) e.category = 'Wybierz kategorię.';
    if (!STAN[stan]) e.condition = 'Wybierz stan produktu.';
    if (brand === 'Inna' && customBrand.trim().length < 2) e.brand = 'Wpisz nazwę marki lub wybierz inną.';
    return e;
  };

  const goToPreview = () => {
    if (!user) return navigation.navigate('Auth');

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!category) return;

    const priceGrosze = Math.round(parseFloat(price.replace(',', '.')) * 100);
    const condition = STAN[stan];

    const draft: ListingDraft = {
      title: title.trim(),
      description: desc.trim() || undefined,
      price: priceGrosze,
      brand: brand === 'Inna' ? (customBrand.trim() || 'Inna') : (brand || undefined),
      size: size || undefined,
      material: material || undefined,
      colors,
      widthCm: width ? parseInt(width, 10) || undefined : undefined,
      lengthCm: length ? parseInt(length, 10) || undefined : undefined,
      condition,
      negotiable: negotiate,
      unisex,
      quantity: isBusiness ? (parseInt(quantity, 10) || 1) : 1,
      groupBuy: isBusiness ? groupBuy : false,
      categoryId: category.id,
      categoryLabel: category.parentPath ? `${category.parentPath} › ${category.name}` : category.name,
    };
    navigation.navigate('PodgladOgloszenia', { draft, photos });
  };

  // Edycja: zapisz zmiany (PATCH) + usuń odznaczone zdjęcia + wgraj nowe.
  const save = async () => {
    if (!edit) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!category) return;

    const priceGrosze = Math.round(parseFloat(price.replace(',', '.')) * 100);
    const condition = STAN[stan];

    setSubmitting(true);
    try {
      await updateListing(edit.id, {
        title: title.trim(),
        description: desc.trim() || undefined,
        price: priceGrosze,
        brand: brand === 'Inna' ? (customBrand.trim() || 'Inna') : (brand || undefined),
        size: size || undefined,
        material: material || undefined,
        color: colors.join(', ') || undefined,
        widthCm: width ? parseInt(width, 10) || undefined : undefined,
        lengthCm: length ? parseInt(length, 10) || undefined : undefined,
        condition,
        negotiable: negotiate,
        unisex,
        ...(isBusiness ? { quantity: parseInt(quantity, 10) || 1, groupBuy } : {}),
        categoryId: category.id,
      });
      // Najpierw dodaj nowe zdjęcia, potem usuń odznaczone — dzięki temu oferta nigdy nie zostaje bez zdjęć.
      for (const ph of photos) { try { await uploadListingImage(edit.id, ph); } catch {} }
      for (const id of removedIds) { try { await deleteListingImage(id); } catch {} }
      setSaved(true);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać zmian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrowLeft" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEdit ? 'Edytuj ogłoszenie' : 'Dodaj ogłoszenie'}</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Zdjęcia — zawijana siatka; ⭐ ustawia okładkę (pierwsze = główne) */}
      <Text style={s.label}>Zdjęcia</Text>
      <View style={[s.photos, { gap: PHOTO_GAP }]} onLayout={(e) => setPhotosW(e.nativeEvent.layout.width)}>
        <TouchableOpacity style={[s.addPhoto, { width: photoTile, height: photoTile }]} onPress={pickImage} activeOpacity={0.8}>
          <Icon name="camera" size={20} color={C.gold} />
          <Text style={s.addPhotoText}>Dodaj zdjęcia</Text>
          <Text style={s.addPhotoHint}>Maks. 10</Text>
        </TouchableOpacity>
        {existingImages.map((e, i) => (
          <View key={e.id} style={[s.thumb, { width: photoTile, height: photoTile }]}>
            <Image source={{ uri: e.url }} style={s.thumbImg} />
            <TouchableOpacity style={s.thumbX} onPress={() => removeExisting(e.id)} hitSlop={6}>
              <Icon name="x" size={11} color="#fff" />
            </TouchableOpacity>
            {i === 0 ? (
              <View style={s.mainBadge}><Text style={s.mainBadgeText}>Główne</Text></View>
            ) : (
              <TouchableOpacity style={s.starBtn} onPress={() => setExistingCover(e.id)} hitSlop={8} activeOpacity={0.7}>
                <Icon name="star" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {photos.map((src, i) => {
          const isCover = existingImages.length === 0 && i === 0;
          return (
            <View key={src.uri} style={[s.thumb, { width: photoTile, height: photoTile }]}>
              <Image source={{ uri: src.uri }} style={s.thumbImg} />
              <TouchableOpacity style={s.thumbX} onPress={() => removePhotoByKey(src.uri)} hitSlop={6}>
                <Icon name="x" size={11} color="#fff" />
              </TouchableOpacity>
              {isCover ? (
                <View style={s.mainBadge}><Text style={s.mainBadgeText}>Główne</Text></View>
              ) : !isEdit && i > 0 ? (
                <TouchableOpacity style={s.starBtn} onPress={() => setMain(i)} hitSlop={8} activeOpacity={0.7}>
                  <Icon name="star" size={12} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
      {existingImages.length + photos.length > 1 ? (
        <Text style={s.photoHint}>Pierwsze zdjęcie jest okładką. Dotknij ⭐ na innym, aby ustawić je jako główne.</Text>
      ) : null}
      {errors.photos ? <Text style={s.errText}>{errors.photos}</Text> : null}

      {/* Tytuł */}
      <Text style={s.label}>Tytuł</Text>
      <View style={[s.inputRow, errors.title ? s.inputErr : null]}>
        <Icon name="tag" size={17} color={C.muted} />
        <TextInput style={s.input} value={title} onChangeText={(t) => { setTitle(t); clearErr('title'); }} placeholder="Wpisz tytuł ogłoszenia" placeholderTextColor={C.muted} />
      </View>
      {errors.title ? <Text style={s.errText}>{errors.title}</Text> : null}

      {/* Opis */}
      <Text style={s.label}>Opis</Text>
      <TextInput style={[s.input, s.textarea]} value={desc} onChangeText={(t) => setDesc(t.slice(0, 2000))} placeholder="Opisz produkt, jego stan, materiał, itp." placeholderTextColor={C.muted} multiline />

      {/* Cena */}
      <Text style={s.label}>Cena</Text>
      <View style={[s.inputRow, errors.price ? s.inputErr : null]}>
        <TextInput style={s.input} value={price} onChangeText={(t) => { setPrice(t); clearErr('price'); }} placeholder="Wpisz cenę" placeholderTextColor={C.muted} keyboardType="numeric" />
        <Text style={s.zl}>zł</Text>
      </View>
      {errors.price ? <Text style={s.errText}>{errors.price}</Text> : null}
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Cena do negocjacji</Text>
        <Toggle on={negotiate} onChange={setNegotiate} />
      </View>

      {/* Kategoria → podkategoria */}
      <View style={{ gap: 10, marginTop: 6 }}>
        <TouchableOpacity style={[s.rowSelect, errors.category ? s.rowSelectErr : null]} onPress={() => setCatPickerOpen(true)} activeOpacity={0.8}>
          <Icon name="grid" size={18} color={C.inkSoft} />
          <Text style={s.rowSelectLabel}>Kategoria</Text>
          <Text style={[s.rowSelectVal, category ? { color: C.ink, fontWeight: '600' } : null]} numberOfLines={1}>
            {category ? category.name : 'Wybierz kategorię'}
          </Text>
          <Icon name="chevronRight" size={16} color={C.muted} />
        </TouchableOpacity>
        {category?.parentPath ? <Text style={s.catBreadcrumb} numberOfLines={1}>{category.parentPath}</Text> : null}
        {errors.category ? <Text style={s.errText}>{errors.category}</Text> : null}

        <RowSelect icon="tag" label="Marka" placeholder="Wybierz markę" value={brand} options={BRANDS} error={errors.brand} onChange={(v) => { setBrand(v); clearErr('brand'); }} />
        {brand === 'Inna' && (
          <View style={s.inputRow}>
            <Icon name="edit" size={17} color={C.muted} />
            <TextInput style={s.input} value={customBrand} onChangeText={(t) => { setCustomBrand(t); clearErr('brand'); }} placeholder="Wpisz nazwę marki" placeholderTextColor={C.muted} />
          </View>
        )}
        <RowSelect icon="shield" label="Stan" placeholder="Wybierz stan" value={stan} options={Object.keys(STAN)} error={errors.condition} onChange={(v) => { setStan(v); clearErr('condition'); }} />
        <RowSelect icon="hanger" label={category?.topSlug === 'obuwie' ? 'Rozmiar (numer buta)' : 'Rozmiar'} placeholder="Wybierz rozmiar" value={size} options={sizeOptions} onChange={setSize} />
        <RowSelect icon="tag" label="Materiał" placeholder="Wybierz materiał" value={material} options={MATERIALS} onChange={setMaterial} />
        <ColorSelect colors={colors} options={COLORS} max={MAX_COLORS} onToggle={toggleColor} />
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Przedmiot unisex</Text>
          <Toggle on={unisex} onChange={setUnisex} />
        </View>
      </View>

      {/* Sprzedaż firmowa — tylko konta firmowe */}
      {isBusiness && (
        <View style={s.bizBlock}>
          <View style={s.bizHead}>
            <Icon name="award" size={15} color={C.gold} />
            <Text style={s.bizTitle}>Sprzedaż firmowa</Text>
          </View>

          <View style={s.bizRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.bizLabel}>Ilość sztuk</Text>
              <Text style={s.bizHint}>Sprzedajesz kilka identycznych przedmiotów?</Text>
            </View>
            <View style={s.qtyBox}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQuantity((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))} hitSlop={8}>
                <Text style={s.qtySign}>−</Text>
              </TouchableOpacity>
              <TextInput style={s.qtyInput} value={quantity} onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQuantity((q) => String(Math.min(9999, (parseInt(q, 10) || 1) + 1)))} hitSlop={8}>
                <Text style={s.qtySign}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.toggleRow, { marginTop: 4 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Wystaw jako „Kup w grupie"</Text>
              <Text style={s.bizHint}>Im więcej osób kupi, tym niższa cena</Text>
            </View>
            <Toggle on={groupBuy} onChange={setGroupBuy} />
          </View>
        </View>
      )}

      {/* Wymiary — osobno szerokość i długość */}
      <Text style={s.label}>Wymiary <Text style={s.labelHint}>(cm, opcjonalnie)</Text></Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[s.inputRow, { flex: 1 }]}>
          <Icon name="sliders" size={17} color={C.muted} />
          <TextInput style={s.input} value={width} onChangeText={setWidth} placeholder="Szerokość" placeholderTextColor={C.muted} keyboardType="numeric" />
          <Text style={s.zl}>cm</Text>
        </View>
        <View style={[s.inputRow, { flex: 1 }]}>
          <Icon name="hanger" size={17} color={C.muted} />
          <TextInput style={s.input} value={length} onChangeText={setLength} placeholder="Długość" placeholderTextColor={C.muted} keyboardType="numeric" />
          <Text style={s.zl}>cm</Text>
        </View>
      </View>

      {/* Ochrona kupujących */}
      <View style={s.protection}>
        <Icon name="shield" size={18} color={C.gold} />
        <Text style={s.protectionText}>Chcę sprzedać z Ochroną Kupujących</Text>
        <Toggle on={protection} onChange={setProtection} />
      </View>

      {Object.values(errors).some(Boolean) ? (
        <View style={s.errorBanner}>
          <Icon name="shield" size={16} color="#B23B36" />
          <Text style={s.errorBannerText}>Uzupełnij zaznaczone pola, aby kontynuować.</Text>
        </View>
      ) : null}

      <Button
        title={isEdit ? 'Zapisz zmiany' : user ? 'Przejdź do podglądu' : 'Zaloguj się, aby dodać'}
        icon={isEdit ? 'check' : user ? 'eye' : undefined}
        full
        loading={submitting}
        onPress={isEdit ? save : goToPreview}
        style={{ marginTop: 20 }}
      />

      <CategoryPicker
        visible={catPickerOpen}
        tree={tree}
        selectedId={category?.id}
        onClose={() => setCatPickerOpen(false)}
        onSelect={(path, leaf) => {
          const ancestors = Array.isArray(path) ? path : [];
          setCategory({ id: leaf.id, name: leaf.name, parentPath: ancestors.map((n) => n.name).join(' › '), topSlug: ancestors[0]?.slug ?? leaf.slug });
          clearErr('category');
          setCatPickerOpen(false);
        }}
      />

      {/* Sukces zapisu edycji (działa też na web — bez Alert.alert) */}
      <Modal visible={saved} transparent animationType="fade" onRequestClose={() => setSaved(false)}>
        <Pressable style={s.successOverlay} onPress={() => {}}>
          <View style={s.successDialog}>
            <View style={s.successIcon}><Icon name="check" size={28} color="#2A7A4A" /></View>
            <Text style={s.successTitle}>Zapisano pomyślnie</Text>
            <Text style={s.successText}>Twoje zmiany są już widoczne w ogłoszeniu.</Text>
            <TouchableOpacity
              style={s.successBtn}
              activeOpacity={0.85}
              onPress={() => { setSaved(false); navigation.navigate('MojeOgloszenia' as never); }}
            >
              <Text style={s.successBtnText}>Przejdź do moich ogłoszeń</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!on)} activeOpacity={0.8} style={[t.track, { backgroundColor: on ? C.gold : C.line, alignItems: on ? 'flex-end' : 'flex-start' }]}>
      <View style={t.knob} />
    </TouchableOpacity>
  );
}

/** Wybór z listy — otwiera przewijany panel (jak Vinted): kap ~78% ekranu, wyszukiwarka gdy >8 opcji. */
/** Wybór z listy — otwiera pełnoekranowy panel (jak Vinted): nagłówek + wyszukiwarka (gdy >8) + lista. */
function RowSelect({ icon, label, placeholder, options, value, onChange, error }: { icon: IconName; label: string; placeholder: string; options: string[]; value?: string; onChange: (v: string) => void; error?: string }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchable = options.length > 8;
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const close = () => { setQ(''); setOpen(false); };
  return (
    <View>
      <TouchableOpacity style={[s.rowSelect, error ? s.rowSelectErr : null]} onPress={() => { setQ(''); setOpen(true); }} activeOpacity={0.8}>
        <Icon name={icon} size={18} color={C.inkSoft} />
        <Text style={s.rowSelectLabel}>{label}</Text>
        <Text style={[s.rowSelectVal, value ? { color: C.ink, fontWeight: '600' } : null]} numberOfLines={1}>{value || placeholder}</Text>
        <Icon name="chevronRight" size={16} color={C.muted} />
      </TouchableOpacity>
      {error ? <Text style={s.errText}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <View style={[s.pickScreen, { paddingTop: insets.top }]}>
          <View style={s.pickHeader}>
            <TouchableOpacity onPress={close} hitSlop={10} style={s.pickHeaderBtn}><Icon name="arrowLeft" size={22} color={C.ink} /></TouchableOpacity>
            <Text style={s.pickHeaderTitle} numberOfLines={1}>{label}</Text>
            <View style={s.pickHeaderBtn} />
          </View>
          {searchable && (
            <View style={s.pickSearchWrap}>
              <View style={s.pickSearch}>
                <Icon name="search" size={16} color={C.muted} />
                <TextInput value={q} onChangeText={setQ} placeholder={`Wyszukaj: ${label.toLowerCase()}`} placeholderTextColor={C.muted} style={s.pickSearchInput} />
              </View>
            </View>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
            {filtered.length === 0 ? (
              <Text style={s.optionEmpty}>Brak wyników</Text>
            ) : (
              filtered.map((o) => (
                <TouchableOpacity key={o} style={s.pickRow} onPress={() => { onChange(o); close(); }} activeOpacity={0.7}>
                  <Text style={[s.pickRowText, o === value && { color: C.gold, fontWeight: '700' }]}>{o}</Text>
                  {o === value && <Icon name="check" size={18} color={C.gold} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/** Wybór kolorów — pełnoekranowy wielokrotny wybór (do `max`), z „✓" przy wybranych. */
function ColorSelect({ colors, options, max, onToggle }: { colors: string[]; options: string[]; max: number; onToggle: (c: string) => void }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={s.rowSelect} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Icon name="image" size={18} color={C.inkSoft} />
        <Text style={s.rowSelectLabel}>Kolory</Text>
        <Text style={[s.rowSelectVal, colors.length ? { color: C.ink, fontWeight: '600' } : null]} numberOfLines={1}>
          {colors.length ? colors.join(', ') : `Wybierz (do ${max})`}
        </Text>
        <Icon name="chevronRight" size={16} color={C.muted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[s.pickScreen, { paddingTop: insets.top }]}>
          <View style={s.pickHeader}>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} style={s.pickHeaderBtn}><Icon name="arrowLeft" size={22} color={C.ink} /></TouchableOpacity>
            <Text style={s.pickHeaderTitle}>Kolory</Text>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} style={s.pickHeaderBtn}><Text style={s.pickDone}>Gotowe</Text></TouchableOpacity>
          </View>
          <Text style={s.pickHint}>Możesz wybrać do {max} kolorów.</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
            {options.map((o) => {
              const active = colors.includes(o);
              const disabled = !active && colors.length >= max;
              return (
                <TouchableOpacity key={o} style={[s.pickRow, disabled && { opacity: 0.4 }]} disabled={disabled} onPress={() => onToggle(o)} activeOpacity={0.7}>
                  <Text style={[s.pickRowText, active && { color: C.gold, fontWeight: '700' }]}>{o}</Text>
                  {active && <Icon name="check" size={18} color={C.gold} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink },
  label: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 8, marginTop: 18 },
  labelHint: { fontSize: 12, fontWeight: '400', color: C.muted },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addPhoto: { width: 84, height: 84, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(192,145,60,0.5)', backgroundColor: 'rgba(242,233,213,0.4)', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: 10, fontWeight: '700', color: C.ink, marginTop: 4 },
  addPhotoHint: { fontSize: 9, color: C.muted },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: C.goldSoft },
  thumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  thumbX: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surface },
  starBtn: { position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(30,27,22,0.45)', alignItems: 'center', justifyContent: 'center' },
  mainBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  setMain: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(30,27,22,0.75)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  setMainText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  photoHint: { fontSize: 11, color: C.muted, marginTop: 8 },
  photoEmpty: { fontSize: 12, color: C.muted, alignSelf: 'center', paddingVertical: 30 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: C.ink },
  textarea: { minHeight: 96, textAlignVertical: 'top', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14 },
  zl: { fontSize: 14, color: C.muted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  toggleLabel: { fontSize: 14, color: C.inkSoft },

  bizBlock: { backgroundColor: 'rgba(242,233,213,0.45)', borderWidth: 1, borderColor: C.gold, borderRadius: 16, padding: 16, marginTop: 18, gap: 6 },
  bizHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bizTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.ink },
  bizRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bizLabel: { fontSize: 14, color: C.ink, fontWeight: '600' },
  bizHint: { fontSize: 12, color: C.muted, marginTop: 2 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 4 },
  qtyBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qtySign: { fontSize: 20, color: C.gold, fontWeight: '700' },
  qtyInput: { minWidth: 36, textAlign: 'center', fontSize: 15, fontWeight: '700', color: C.ink, paddingVertical: 6 },
  rowSelect: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.surface },
  rowSelectErr: { borderColor: '#B23B36' },
  rowSelectLabel: { fontSize: 14, color: C.ink },
  rowSelectVal: { flex: 1, fontSize: 13, color: C.muted, textAlign: 'right' },
  errText: { color: '#B23B36', fontSize: 12, marginTop: 5, marginLeft: 2 },
  catBreadcrumb: { fontSize: 12, color: C.muted, marginTop: 5, marginLeft: 4 },
  inputErr: { borderColor: '#B23B36' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FCEBEA', borderWidth: 1, borderColor: '#F3C9C5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 18 },
  errorBannerText: { flex: 1, color: '#B23B36', fontSize: 13, fontWeight: '600' },

  pickScreen: { flex: 1, backgroundColor: C.bg },
  pickHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface },
  pickHeaderBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pickHeaderTitle: { flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink },
  pickDone: { fontSize: 13, fontWeight: '700', color: C.gold },
  pickHint: { fontSize: 13, color: C.muted, paddingHorizontal: 16, paddingTop: 12 },
  pickSearchWrap: { padding: 16, paddingBottom: 8 },
  pickSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  pickSearchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  pickRowText: { fontSize: 16, color: C.ink },
  dropdown: { marginTop: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 6 },
  option: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8 },
  optionActive: { backgroundColor: C.goldSoft },
  optionText: { fontSize: 13, color: C.inkSoft },
  optionEmpty: { fontSize: 13, color: C.muted, padding: 11 },
  protection: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,233,213,0.4)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  protectionText: { flex: 1, fontSize: 13, color: C.inkSoft },

  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  successDialog: { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 24, alignItems: 'center' },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(42,122,74,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontFamily: SERIF, fontSize: 21, fontWeight: '700', color: C.ink, textAlign: 'center' },
  successText: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  successBtn: { alignSelf: 'stretch', backgroundColor: C.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  successBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const t = StyleSheet.create({
  track: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
