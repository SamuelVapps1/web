export interface Review {
  id: string;
  quote: string;
  name: string;
  initials: string;
  source: string;
}

// Copy reproduced verbatim z Claude Design exportu (index.html).
// Samuel: pred publikovaním over, že sú to reálne Google recenzie / súhlas autorov.
export const REVIEWS: Review[] = [
  {
    id: 'r1',
    quote: 'Chodíme k nej už 13 rokov. Náš pes sa inde triasol — tu je pokojný a vždy nádherne ostrihaný.',
    name: 'Martina K.',
    initials: 'M',
    source: 'Google recenzia',
  },
  {
    id: 'r2',
    quote: 'Náš kólia má veľmi náročnú srsť. Laura to zvládla za jedno popoludnie a pes bol počas celého strihu pokojný.',
    name: 'Peter V.',
    initials: 'P',
    source: 'Google recenzia',
  },
  {
    id: 'r3',
    quote: 'Profesionálka starej školy. Žiadne reči, len výsledok. Náš senior je u nej v dobrých rukách.',
    name: 'Zuzana H.',
    initials: 'Z',
    source: 'Google recenzia',
  },
];
