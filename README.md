# Laura salón pre psov — Petržalka

Production-ready Next.js website for Laura salón pre psov, a dog grooming salon in Petržalka, Bratislava. Built with Next.js App Router, TypeScript, and server-side rendering for optimal SEO.

## Stack

- **Next.js 16** (App Router) — React framework with SSG/SSR
- **TypeScript** — Type safety
- **Fraunces** (serif) + **Inter** (sans) — Google Fonts via next/font
- **lucide-react** — Icon library
- **next/image** — Optimized image component
- Custom CSS with design system variables (no Tailwind CSS)

## Project Structure

```
web/
├── app/
│   ├── layout.tsx          # Root layout with fonts and JSON-LD
│   ├── page.tsx            # Homepage
│   ├── cennik/page.tsx     # Pricing page
│   ├── galeria/page.tsx    # Gallery with lightbox
│   ├── o-nas/page.tsx      # About page
│   ├── kontakt/page.tsx    # Contact page with Google Maps
│   ├── rezervacia/page.tsx # Booking placeholder
│   ├── sitemap.ts          # Sitemap generator
│   ├── robots.ts           # Robots.txt generator
│   └── globals.css         # Global styles and design system
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Footer with contact info
│   ├── BookingCTA.tsx      # Call-to-action component
│   ├── Photo.tsx           # Image wrapper with placeholder
│   ├── RevealOnScroll.tsx  # Scroll animation hook
│   └── JsonLd.tsx          # JSON-LD schema component
├── data/
│   ├── gallery.ts          # Gallery data (order = array order)
│   ├── site-images.ts      # Hero, story, about — single-photo paths
│   ├── pricing.ts          # Pricing data
│   └── reviews.ts          # Reviews data (placeholders)
└── public/
    └── images/             # Photo assets (see „Ako pridať fotku")
        ├── hero/           # before.jpg, after.jpg
        ├── home/           # story.jpg
        ├── o-nas/          # interier.jpg
        └── galeria/        # NN-before.jpg, NN-after.jpg
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `web` in project settings
4. Deploy

Vercel will automatically detect Next.js and configure the build settings.

## Ako pridať fotku

Všetky cesty sú v data súboroch — **neprepisuj komponenty**. Stačí súbor na disk + jeden riadok v dátach.

### Odporúčaný formát

- **Pomer strán:** portrét 4:5 (dlhšia hrana ~1600 px)
- **Formát:** `.jpg` alebo `.webp` (Next.js zvyšok zoptimalizuje)
- **Veľkosť:** ideálne pod ~500 kB

### Galéria (pred/po)

1. Pomenovať súbory podľa čísla položky: `01-before.jpg` + `01-after.jpg`, `02-before.jpg` + `02-after.jpg`, …
2. Skopírovať do `public/images/galeria/`
3. V `data/gallery.ts` pridať jednu položku (cesty vygeneruje helper `galleryPaths`).
4. Hotovo. Žiadny skript na orezávanie netreba spúšťať.

```ts
{ ...galleryPaths(4), breed: 'Havanský psík', case: 'Prvý strih šteňaťa', h: 280 },
```

To vytvorí `id: '04'`, `before: '/images/galeria/04-before.jpg'`, `after: '/images/galeria/04-after.jpg'`.

**Poradie v galérii = poradie v poli.** Presun položky hore/dole = zmena poradia na webe. Číslo v názve súboru je len pre prehľadnosť v priečinku.

Homepage teaser „Premeny" a O nás „Z galérie" automaticky berú **prvé 3 položky** z poľa — netreba nič meniť inde.

### Hero, Príbeh, O nás (jedna fotka)

| Slot | Súbor | Konštanta v `data/site-images.ts` |
|------|-------|-----------------------------------|
| Homepage hero — Pred | `public/images/hero/before.jpg` | `heroBefore` |
| Homepage hero — Po | `public/images/hero/after.jpg` | `heroAfter` |
| Homepage Príbeh | `public/images/home/story.jpg` | `homeStory` |
| O nás — interiér | `public/images/o-nas/interier.jpg` | `aboutInterior` |

Buď **nahraď súbor** na danej ceste, alebo **zmeň cestu** v `data/site-images.ts`.

### Chýbajúca fotka

Ak súbor ešte neexistuje, `<Photo>` zobrazí placeholder v rovnakom rozmere — stránka nespadne a layout neskáče.

## Design System

The design uses custom CSS variables defined in `app/globals.css`:

- **Colors**: Cream base, cognac accent, brass highlights
- **Typography**: Fraunces (serif headings), Inter (body)
- **Spacing**: 8-step scale
- **Radii**: 3px, 6px, 10px
- **Shadows**: Soft, warm-tinted

Responsive breakpoints:
- Desktop: > 1060px
- Tablet: 680px - 1060px
- Mobile: < 680px (with sticky booking bar)

## SEO Features

- **JSON-LD Schema**: LocalBusiness with full contact info and opening hours
- **Sitemap**: Auto-generated at `/sitemap.xml`
- **Robots.txt**: Auto-generated at `/robots.txt`
- **Metadata**: Unique meta tags per page
- **Server-Side Rendering**: All content is in HTML for Google indexing

## Routes

- `/` — Homepage with hero, differentiators, before/after, about teaser, reviews
- `/galeria` — Gallery with masonry layout and lightbox (30 items)
- `/cennik` — Pricing with menu card layout
- `/o-nas` — About page with story and credentials
- `/kontakt` — Contact page with phone, hours, address, Google Maps
- `/rezervacia` — Booking placeholder (future feature)

## Navigation & CTA Behavior

- Homepage CTA buttons → `/kontakt` and `/galeria`
- Gallery CTA → `/kontakt`
- Cennik CTA → `/kontakt`
- About page CTA → `/kontakt` and `/galeria`
- Contact page CTA → `tel:+421944240116` (tap-to-call)
- Mobile sticky bar → `tel:+421944240116` and `/kontakt`

## Placeholder Seams

The following features are prepared but not implemented:
- **Online booking** (`/rezervacia`) — Placeholder page ready for booking app integration
- **Gallery photos** — pridaj súbory do `public/images/galeria/` a položky do `data/gallery.ts` (pozri „Ako pridať fotku")
- **Reviews** — Placeholder data in `data/reviews.ts`, replace with actual Google reviews

## Punch-list pre Samuela (mimo kódu)

Tieto veci treba doplniť mimo kódu pred / po deployi:

- **Reálne fotky** — pozri sekciu „Ako pridať fotku" vyššie. Placeholdery držia rozmer, takže layout neskáče.
- **Verbatim Google recenzie** — nahradiť placeholder v `data/reviews.ts` skutočnými menami a citátmi (teraz sú zámerne označené ako PLACEHOLDER).
- **Cena trimovania** — v `data/pricing.ts` je `na vyžiadanie`; doplniť reálnu cenu alebo ponechať.
- **GPS súradnice** — v `app/layout.tsx` (JSON-LD `geo`) sú približné (48.1216, 17.1045). Overiť presné súradnice prevádzky Osuského 7.
- **OG obrázok** — pridať `public/og.jpg` (1200×630). Metadáta naň už odkazujú.
- **Doména / DNS** — `metadataBase`, canonical a JSON-LD používajú `https://laurasalon.sk`. Po cutover overiť.

## Contact Information

- **Phone**: +421 944 240 116
- **Address**: Osuského 7, 851 03 Bratislava-Petržalka
- **Hours**: Po–Pia 10:00–13:00 and 14:00–18:00 (closed Sat–Sun)
- **Instagram**: [@laura_salon_pre_psov](https://www.instagram.com/laura_salon_pre_psov/)
- **Domain**: laurasalon.sk

## License

© 2026 Laura salón pre psov
