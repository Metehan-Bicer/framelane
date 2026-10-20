export type ImageInfo = { mime: "image/png" | "image/jpeg"; width: number; height: number };

/** Reads the pixel size from a PNG or JPEG header without decoding the image. */
export function readImageInfo(bytes: Uint8Array): ImageInfo | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const isPng = bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a;
  if (isPng) return { mime: "image/png", width: view.getUint32(16), height: view.getUint32(20) };

  const isJpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!isJpeg) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = view.getUint16(offset + 2);
    // Start of frame markers carry the dimensions; skip DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { mime: "image/jpeg", height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}
