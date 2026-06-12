import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import "./mobile-first.css";
import JsonLd from "@/components/JsonLd";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  metadataBase: new URL("https://laurasalon.sk"),
  title: {
    default: "Laura salón pre psov — Petržalka",
    template: "%s — Laura salón pre psov",
  },
  description:
    "Salón pre psov v Petržalke. Tridsať rokov skúseností s úpravou psov — profesionálny strih prispôsobený plemenu, srsti aj povahe vášho psa.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    siteName: "Laura salón pre psov",
    url: "https://laurasalon.sk",
    title: "Laura salón pre psov — Petržalka",
    description:
      "Salón pre psov v Petržalke. Tridsať rokov skúseností s úpravou psov.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Laura salón pre psov" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HairSalon"],
  "@id": "https://laurasalon.sk/#business",
  name: "Laura salón pre psov",
  alternateName: "Laura salón",
  description: "Salón pre psov v Petržalke. Tridsať rokov skúseností s úpravou psov.",
  url: "https://laurasalon.sk",
  telephone: "+421944240116",
  image: "https://laurasalon.sk/og.jpg",
  priceRange: "€€",
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Osuského 7",
    addressLocality: "Bratislava-Petržalka",
    postalCode: "851 03",
    addressCountry: "SK",
  },
  geo: {
    "@type": "GeoCoordinates",
    // PLACEHOLDER — Samuel: over presné GPS súradnice prevádzky (Osuského 7).
    latitude: 48.1216,
    longitude: 17.1045,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.6",
    reviewCount: "105",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "13:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "14:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/laura_salon_pre_psov/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      style={
        {
          '--font-fraunces': 'Georgia, "Times New Roman", serif',
          '--font-inter': 'Inter, system-ui, sans-serif',
        } as CSSProperties
      }
    >
      <body>
        <JsonLd data={jsonLd} />
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
