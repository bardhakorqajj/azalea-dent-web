/**
 * Validating an uploaded image, from its bytes.
 *
 * The browser's `file.type` and the filename extension are both attacker
 * controlled, so neither is trusted: the format is decided by the file's own
 * magic bytes, and the dimensions are read out of the header. That also means
 * a file that merely *claims* to be a JPEG is rejected before it is stored,
 * and it is why no image-processing dependency is needed to do this safely.
 *
 * Uploads are stored as sent, and Next's image optimiser resizes and re-encodes
 * them on the way out — so the site serves AVIF/WebP at the size each layout
 * asks for without a server-side image library in the request path.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** 8 MB. Comfortable for a phone photo, small enough to store as a row. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type ImageProbe = {
  mimeType: AllowedImageType;
  width: number | null;
  height: number | null;
};

/** Human-readable size, for the "too large" message and the file list. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Identifies the format and reads the dimensions, or returns null when the
 * bytes are not one of the four formats accepted.
 */
export function probeImage(bytes: Uint8Array): ImageProbe | null {
  if (isJpeg(bytes)) {
    return { mimeType: "image/jpeg", ...(jpegSize(bytes) ?? { width: null, height: null }) };
  }
  if (isPng(bytes)) {
    return { mimeType: "image/png", ...(pngSize(bytes) ?? { width: null, height: null }) };
  }
  if (isWebp(bytes)) {
    return { mimeType: "image/webp", ...(webpSize(bytes) ?? { width: null, height: null }) };
  }
  if (isAvif(bytes)) {
    /* AVIF dimensions live in an ISOBMFF box tree; reading them is not worth
       the code here, since the optimiser and the browser both cope without. */
    return { mimeType: "image/avif", width: null, height: null };
  }
  return null;
}

function isJpeg(b: Uint8Array): boolean {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function isPng(b: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return b.length > 24 && signature.every((byte, index) => b[index] === byte);
}

function isWebp(b: Uint8Array): boolean {
  return (
    b.length > 16 &&
    ascii(b, 0, 4) === "RIFF" &&
    ascii(b, 8, 4) === "WEBP"
  );
}

function isAvif(b: Uint8Array): boolean {
  /* ftyp box at offset 4, with an AVIF brand. */
  if (b.length < 16 || ascii(b, 4, 4) !== "ftyp") return false;
  const brand = ascii(b, 8, 4);
  return brand === "avif" || brand === "avis";
}

function ascii(b: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = offset; i < offset + length && i < b.length; i += 1) {
    out += String.fromCharCode(b[i] as number);
  }
  return out;
}

/** PNG puts width and height in the IHDR chunk, at a fixed offset. */
function pngSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 24) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/**
 * JPEG has no fixed header: the dimensions are in whichever SOF marker the
 * encoder used, so the marker chain has to be walked to find it.
 */
function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let offset = 2;

  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      /* Fill bytes are legal between markers; anything else means the chain
         is broken and there is nothing reliable left to read. */
      offset += 1;
      continue;
    }

    const marker = b[offset + 1] as number;

    /* Padding, and the standalone markers that carry no length. */
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    /* Start of scan: the compressed data begins, so the header is over. */
    if (marker === 0xda) return null;

    const length = view.getUint16(offset + 2);
    if (length < 2) return null;

    /* SOF0…SOF15, excluding the DHT/JPG/DAC markers interleaved in the range. */
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isSof) {
      if (offset + 9 >= b.length) return null;
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
}

/** WebP comes in three chunk flavours, each storing the size differently. */
function webpSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 30) return null;
  const chunk = ascii(b, 12, 4);
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);

  if (chunk === "VP8 ") {
    /* Lossy: a 3-byte start code, then 14-bit width and height. */
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }

  if (chunk === "VP8L") {
    /* Lossless: 14 bits each, packed little-endian after the signature byte. */
    const bits =
      (b[21] as number) |
      ((b[22] as number) << 8) |
      ((b[23] as number) << 16) |
      ((b[24] as number) << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunk === "VP8X") {
    /* Extended: 24-bit canvas size, minus one. */
    const width =
      ((b[24] as number) | ((b[25] as number) << 8) | ((b[26] as number) << 16)) + 1;
    const height =
      ((b[27] as number) | ((b[28] as number) << 8) | ((b[29] as number) << 16)) + 1;
    return { width, height };
  }

  return null;
}
