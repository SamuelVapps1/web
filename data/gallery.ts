export interface GalleryItem {
  id: string;
  breed: string;
  case: string;
  h: number;
  before: string;
  after: string;
}

function galleryPaths(n: number) {
  const id = String(n).padStart(2, '0');
  return {
    id,
    before: `/images/galeria/${id}-before.jpeg`,
    after: `/images/galeria/${id}-after.jpeg`,
  };
}

/** SEO alt text: breed + service description. */
export function galleryAlt(item: Pick<GalleryItem, 'breed' | 'case'>): string {
  return `${item.breed} — ${item.case}`;
}

/** Gallery order = array order. Reorder by moving items in this array. */
export const gallery: GalleryItem[] = [
  { ...galleryPaths(1), breed: 'Kerry blue teriér', case: 'Silne splstnatená srsť · 2,5 hod', h: 300 },
  { ...galleryPaths(2), breed: 'Pudel stredný', case: 'Výstavné strihanie', h: 240 },
  { ...galleryPaths(3), breed: 'Jorkšírsky teriér, 14 r.', case: 'Senior pes · šetrné tempo', h: 280 },
  { ...galleryPaths(4), breed: 'labradudl Dafné', case: 'Kúpeľ a tvarovanie', h: 220 },
  { ...galleryPaths(5), breed: 'Kokeršpaniel', case: 'Trimovanie uší a labiek', h: 300 },
  { ...galleryPaths(6), breed: 'Yorkshire teriér biever', case: 'Letný strih', h: 260 },
  { ...galleryPaths(7), breed: 'Maltézik', case: 'Odstránenie zaplstnatenia', h: 240 },
  { ...galleryPaths(8), breed: 'Shih-tzu', case: 'Letný komfortný strih', h: 280 },
  { ...galleryPaths(9), breed: 'West highland teriér', case: 'Trimming', h: 220 },
  { ...galleryPaths(10), breed: 'Pudel toy', case: 'Plyšový strih', h: 300 },
  { ...galleryPaths(11), breed: 'Kólia dlhosrstá', case: 'Rozčesanie podsady', h: 260 },
  { ...galleryPaths(12), breed: 'Yorkshire teriér', case: 'Štandardný strih', h: 240 },
  { ...galleryPaths(13), breed: 'Havanský psík', case: 'Prvý strih šteňaťa', h: 280 },
  { ...galleryPaths(14), breed: 'Border teriér', case: 'Trimovanie', h: 220 },
  { ...galleryPaths(15), breed: 'Bišon à poil frisé', case: 'Tvarovanie do gule', h: 300 },
  { ...galleryPaths(16), breed: 'Americký kokeršpaniel', case: 'Plemenný strih', h: 260 },
  { ...galleryPaths(17), breed: 'Pudel veľký', case: 'Kontinentálny strih', h: 280 },
  { ...galleryPaths(18), breed: 'Tibetský teriér', case: 'Rozčesanie a skrátenie', h: 240 },
  { ...galleryPaths(19), breed: 'Bolonák', case: 'Kúpeľ a strih', h: 220 },
  { ...galleryPaths(20), breed: 'Lhasa apso', case: 'Skrátenie srsti', h: 300 },
  { ...galleryPaths(21), breed: 'Airedale teriér', case: 'Trimovanie', h: 260 },
  { ...galleryPaths(22), breed: 'Kníračik malý', case: 'Plemenný strih', h: 240 },
  { ...galleryPaths(23), breed: 'Pekinéz, 12 r.', case: 'Senior · šetrné tempo', h: 220 },
  { ...galleryPaths(24), breed: 'Špic stredný', case: 'Sprchovanie podsady', h: 280 },
  { ...galleryPaths(25), breed: 'Cavapoo', case: 'Plyšový strih', h: 260 },
  { ...galleryPaths(26), breed: 'Goldendoodle', case: 'Odstránenie zaplstnatenia', h: 300 },
  { ...galleryPaths(27), breed: 'Drôtosrstý jazvečík', case: 'Trimovanie', h: 240 },
  { ...galleryPaths(28), breed: 'Foxteriér drôtosrstý', case: 'Trimming', h: 220 },
  { ...galleryPaths(29), breed: 'Coton de Tuléar', case: 'Tvarovanie', h: 280 },
  { ...galleryPaths(30), breed: 'Pudel-kríženec', case: 'Letný komfortný strih', h: 260 },
];

/** @deprecated Use `gallery` — kept for existing imports. */
export const GALLERY_ITEMS = gallery;

/** First N gallery items for homepage / about teasers. */
export const galleryTeaser = gallery.slice(0, 3);
