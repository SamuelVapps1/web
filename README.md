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
│   ├── gallery.ts          # Gallery data (30 items)
│   ├── pricing.ts          # Pricing data
│   └── reviews.ts          # Reviews data (placeholders)
└── public/
    └── images/             # Place images here
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

## Adding Photos

Photos should be placed in `public/images/` directory. Update the photo paths in:

1. **Gallery**: Edit `data/gallery.ts` and add `before` and `after` image paths
2. **Homepage**: Update `Photo` components in `app/page.tsx`
3. **About page**: Update `Photo` components in `app/o-nas/page.tsx`
4. **Credentials**: Update `Photo` components in `app/o-nas/page.tsx`

Example:
```tsx
<Photo src="/images/before-after-1-before.jpg" alt="Pred úpravou" width={600} height={700} />
```

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
- **Gallery photos** — Data structure in place, add photos to `public/images/` and update `data/gallery.ts`
- **Reviews** — Placeholder data in `data/reviews.ts`, replace with actual Google reviews

## Punch-list pre Samuela (mimo kódu)

Tieto veci treba doplniť mimo kódu pred / po deployi:

- **Reálne fotky** — pridať do `public/images/` a doplniť cesty (`before`/`after`) v `data/gallery.ts`; hero a o-nas fotky v príslušných stránkach. Placeholdery držia rozmer, takže layout neskáče.
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
