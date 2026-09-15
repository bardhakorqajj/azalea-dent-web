import type { Photo } from "@/content/images";
import { locales, type Locale } from "@/i18n/config";
import { text, type GalleryKind } from "@/lib/db/types";

import { getPublicGallery } from "./content";

/**
 * The photographs the clinic has uploaded, as the gallery's own `Photo` shape.
 *
 * These *extend* the site's photography rather than replacing it: the rooms
 * shot for the site are the gallery's foundation and stay whatever the clinic
 * uploads. Only published entries are returned, and a treatment photograph
 * cannot be published without recorded consent — see the check constraint in
 * the migration.
 *
 * An entry with no alt text is left out. The gallery is a strip of images with
 * no visible caption on the tile, so an unlabelled photograph is unusable with
 * a screen reader; the dashboard refuses to publish one, and this is the belt
 * to that braces.
 */
export type UploadedPhoto = Photo & { kind: GalleryKind };

export async function publicGalleryPhotos(): Promise<UploadedPhoto[]> {
  const rows = await getPublicGallery();

  return rows
    .filter((row) => locales.some((locale) => text(row.alt, locale) !== ""))
    .map((row) => {
      const alt = {} as Record<Locale, string>;
      const caption = {} as Record<Locale, string>;
      for (const locale of locales) {
        alt[locale] = text(row.alt, locale);
        caption[locale] = text(row.caption, locale);
      }

      return {
        kind: row.kind,
        src: {
          url: `/api/media/${row.media_id}`,
          /* The dimensions read off the file at upload. Next needs them to
             reserve the space and avoid a layout shift; an AVIF upload has
             none recorded, so a 4:3 default stands in. */
          width: row.width ?? 1600,
          height: row.height ?? 1200,
        },
        alt: alt as Photo["alt"],
        caption: caption as Photo["caption"],
      };
    });
}

/** The uploads of one kind, so treatment photographs stay in their own strip. */
export function photosOfKind(
  photos: UploadedPhoto[],
  kind: GalleryKind,
): Photo[] {
  return photos.filter((photo) => photo.kind === kind);
}
