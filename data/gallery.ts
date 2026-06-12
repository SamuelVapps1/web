import galleryData from './gallery.json';

export interface GalleryItem {
  id: string;
  breed: string;
  service: string;
  alt: string;
  featured: boolean;
  h: number;
  before: string;
  after: string;
}

export const gallery = galleryData as GalleryItem[];

/** SEO alt text comes from the data file. */
export function galleryAlt(item: Pick<GalleryItem, 'alt'>): string {
  return item.alt;
}

const featuredGallery = gallery.filter((item) => item.featured);

/** Gallery order = array order. Reorder by moving items in the data file. */
export const galleryTeaser = featuredGallery.length > 0 ? featuredGallery.slice(0, 3) : gallery.slice(0, 3);

/** @deprecated Use `gallery` — kept for existing imports. */
export const GALLERY_ITEMS = gallery;
