import { describe, expect, it } from "vitest";
import { matchDisplaySize } from "./display-sizes";

describe("matchDisplaySize", () => {
  it("matches portrait and landscape sizes", () => {
    expect(matchDisplaySize(1320, 2868)?.type).toBe("APP_IPHONE_67");
    expect(matchDisplaySize(2868, 1320)?.type).toBe("APP_IPHONE_67");
    expect(matchDisplaySize(2064, 2752)?.type).toBe("APP_IPAD_PRO_3GEN_129");
  });

  it("returns undefined for sizes App Store Connect rejects", () => {
    expect(matchDisplaySize(1179, 2556)).toBeUndefined();
  });
});
