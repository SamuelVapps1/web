export interface PricingItem {
  name: string;
  price: string;
  note?: string;
}

export interface PricingSection {
  title: string;
  items: PricingItem[];
  note?: string;
}

export const PRICING: PricingSection[] = [
  {
    title: 'Strihanie',
    items: [
      { name: 'Malý pes', price: '40 €' },
      { name: 'Stredný pes', price: '50 €' },
      { name: 'Veľký pes', price: '60 €' },
    ],
    note: 'Kúpanie — príplatok +15 €',
  },
  {
    title: 'Ďalšie úkony',
    items: [
      { name: 'Strihanie pazúrikov', price: '5 €' },
      { name: 'Čistenie uší', price: '5 €' },
      { name: 'Trimovanie', price: 'na vyžiadanie', note: '⚠️ PLACEHOLDER — rozhodujú rodičia' },
    ],
  },
];

export const ALA_CARTE = {
  title: 'Nadštandardná úprava',
  description: 'Silne splstnatená srsť, výstavné a špeciálne strihy. Cena podľa náročnosti a stavu srsti.',
  price: 'dohodou',
};
