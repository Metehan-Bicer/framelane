import { describe, expect, it } from "vitest";
import { readImageInfo } from "./image-size";

function png(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number) {
  // SOI, an APP0 segment, then a baseline SOF0 segment.
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00];
  const sof0 = [0xff, 0xc0, 0x00, 0x0b, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x01, 0, 0, 0];
  return new Uint8Array([0xff, 0xd8, ...app0, ...sof0]);
}

describe("readImageInfo", () => {
  it("reads PNG dimensions", () => {
    expect(readImageInfo(png(1320, 2868))).toEqual({ mime: "image/png", width: 1320, height: 2868 });
  });

  it("reads JPEG dimensions after other segments", () => {
    expect(readImageInfo(jpeg(1290, 2796))).toEqual({ mime: "image/jpeg", width: 1290, height: 2796 });
  });

  it("rejects other formats", () => {
    expect(readImageInfo(new TextEncoder().encode("GIF89a........................"))).toBeNull();
  });
});
