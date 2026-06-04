export interface Review {
  id: string;
  quote: string;
  name: string;
  initials: string;
  source: string;
}

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    quote:
      'Vrelo odporúčam. Bola som tam so psíkom prvýkrát ale určite budeme navštevovať častejšie. Milí ústretoví zamestnanci, obchod má široký sortiment, rýchle objednanie a strihanie psa presne podľa predstáv. Naozaj veľká vďaka',
    name: 'Martina Vrlabova',
    initials: 'M',
    source: 'Google recenzia',
  },
  {
    id: 'r2',
    quote:
      'Veľmi príjemný personál. Maximálne sa venujú Vášmu miláčikovi. Psík od nich vždy odchádza nádherne ostrihaný. Majú široký výber cez jedlo, pamlsky, obojky, oblečenie a hračky a to aj pre mačičky, hlodavce a vtáčiky. VRELO odporúča',
    name: 'Ivana Králiková',
    initials: 'P',
    source: 'Google recenzia',
  },
  {
    id: 'r3',
    quote:
      'Malá predajňa úplne narávaná tovarom pre domácich miláčikov a salón k tomu. Za veľmi slušné peniaze všetko možné, ak nemajú tak ochotne objednajú za ceny ktoré sú jednoducho super.',
    name: 'Branislav Zajiček',
    initials: 'Z',
    source: 'Google recenzia',
  },
];
