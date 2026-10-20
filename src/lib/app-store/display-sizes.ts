/**
 * Screenshot sizes accepted by App Store Connect, portrait orientation.
 * Landscape uses the same values with width and height swapped.
 * Source: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
 */
export type DisplayType = "APP_IPHONE_67" | "APP_IPHONE_65" | "APP_IPAD_PRO_3GEN_129";

export type DisplaySize = {
  /** Value used by the App Store Connect API (`screenshotDisplayType`). */
  type: DisplayType;
  label: string;
  device: "iphone" | "ipad";
  /** Accepted pixel sizes, the first one is what Framelane exports by default. */
  sizes: ReadonlyArray<{ width: number; height: number }>;
  /** Apple requires at least this display for the device family. */
  required: boolean;
};

export const DISPLAY_SIZES: readonly DisplaySize[] = [
  {
    type: "APP_IPHONE_67",
    label: 'iPhone 6.9"',
    device: "iphone",
    sizes: [
      { width: 1320, height: 2868 },
      { width: 1290, height: 2796 },
      { width: 1260, height: 2736 },
    ],
    required: true,
  },
  {
    type: "APP_IPHONE_65",
    label: 'iPhone 6.5"',
    device: "iphone",
    sizes: [
      { width: 1284, height: 2778 },
      { width: 1242, height: 2688 },
    ],
    required: false,
  },
  {
    type: "APP_IPAD_PRO_3GEN_129",
    label: 'iPad 13"',
    device: "ipad",
    sizes: [
      { width: 2064, height: 2752 },
      { width: 2048, height: 2732 },
    ],
    required: true,
  },
];

export const MAX_SCREENSHOTS_PER_SET = 10;

/** Returns the display a pixel size belongs to, in either orientation. */
export function matchDisplaySize(width: number, height: number): DisplaySize | undefined {
  return DISPLAY_SIZES.find((display) =>
    display.sizes.some(
      (size) =>
        (size.width === width && size.height === height) ||
        (size.width === height && size.height === width),
    ),
  );
}
