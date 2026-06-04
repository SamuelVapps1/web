export interface GalleryItem {
  id: string;
  breed: string;
  case: string;
  h: number;
  before?: string;
  after?: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: 'g1', breed: 'Kerry blue teriér', case: 'Silne splstnatená srsť · 2,5 hod', h: 300 },
  { id: 'g2', breed: 'Pudel stredný', case: 'Výstavné strihanie', h: 240 },
  { id: 'g3', breed: 'Jorkšírsky teriér, 14 r.', case: 'Senior pes · šetrné tempo', h: 280 },
  { id: 'g4', breed: 'Bišonek', case: 'Kúpeľ a tvarovanie', h: 220 },
  { id: 'g5', breed: 'Kokeršpaniel', case: 'Trimovanie uší a labiek', h: 300 },
  { id: 'g6', breed: 'Knírač stredný', case: 'Plemenný strih + brada', h: 260 },
  { id: 'g7', breed: 'Maltézik', case: 'Odstránenie zaplstnatenia', h: 240 },
  { id: 'g8', breed: 'Shih-tzu', case: 'Letný komfortný strih', h: 280 },
  { id: 'g9', breed: 'West highland teriér', case: 'Trimming', h: 220 },
  { id: 'g10', breed: 'Pudel toy', case: 'Plyšový strih', h: 300 },
  { id: 'g11', breed: 'Kólia dlhosrstá', case: 'Rozčesanie podsady', h: 260 },
  { id: 'g12', breed: 'Yorkshire teriér', case: 'Štandardný strih', h: 240 },
  { id: 'g13', breed: 'Havanský psík', case: 'Prvý strih šteňaťa', h: 280 },
  { id: 'g14', breed: 'Border teriér', case: 'Trimovanie', h: 220 },
  { id: 'g15', breed: 'Bišon à poil frisé', case: 'Tvarovanie do gule', h: 300 },
  { id: 'g16', breed: 'Americký kokeršpaniel', case: 'Plemenný strih', h: 260 },
  { id: 'g17', breed: 'Pudel veľký', case: 'Kontinentálny strih', h: 280 },
  { id: 'g18', breed: 'Tibetský teriér', case: 'Rozčesanie a skrátenie', h: 240 },
  { id: 'g19', breed: 'Bolonák', case: 'Kúpeľ a strih', h: 220 },
  { id: 'g20', breed: 'Lhasa apso', case: 'Skrátenie srsti', h: 300 },
  { id: 'g21', breed: 'Airedale teriér', case: 'Trimovanie', h: 260 },
  { id: 'g22', breed: 'Kníračik malý', case: 'Plemenný strih', h: 240 },
  { id: 'g23', breed: 'Pekinéz, 12 r.', case: 'Senior · šetrné tempo', h: 220 },
  { id: 'g24', breed: 'Špic stredný', case: 'Sprchovanie podsady', h: 280 },
  { id: 'g25', breed: 'Cavapoo', case: 'Plyšový strih', h: 260 },
  { id: 'g26', breed: 'Goldendoodle', case: 'Odstránenie zaplstnatenia', h: 300 },
  { id: 'g27', breed: 'Drôtosrstý jazvečík', case: 'Trimovanie', h: 240 },
  { id: 'g28', breed: 'Foxteriér drôtosrstý', case: 'Trimming', h: 220 },
  { id: 'g29', breed: 'Coton de Tuléar', case: 'Tvarovanie', h: 280 },
  { id: 'g30', breed: 'Pudel-kríženec', case: 'Letný komfortný strih', h: 260 },
];
