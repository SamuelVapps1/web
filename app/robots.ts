import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/diar'],
    },
    sitemap: 'https://laurasalon.sk/sitemap.xml',
  };
}
