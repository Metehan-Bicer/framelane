import { describe, expect, it } from "vitest";
import { EMPTY_LISTING } from "@/lib/app-store/listing";
import { hasChanges, planMetadata } from "./plan";

const listing = { ...EMPTY_LISTING, name: "Odaq", keywords: "focus,timer", description: "A calm timer." };

describe("planMetadata", () => {
  it("updates only the fields that differ", () => {
    const plan = planMetadata(
      { "en-US": listing },
      [
        {
          locale: "en-US",
          version: { id: "v1", fields: { description: "A calm timer.", keywords: "focus" } },
          info: { id: "i1", fields: { name: "Odaq" } },
        },
      ],
      { infoEditable: true },
    );
    expect(plan[0].version).toEqual({
      action: "update",
      id: "v1",
      changes: [{ field: "keywords", from: "focus", to: "focus,timer" }],
    });
    expect(plan[0].info).toEqual({ action: "none", id: "i1", changes: [] });
    expect(hasChanges(plan)).toBe(true);
  });

  it("creates localizations that do not exist yet", () => {
    const [entry] = planMetadata({ tr: listing }, [], { infoEditable: true });
    expect(entry.version.action).toBe("create");
    expect(entry.info.action).toBe("create");
  });

  it("never clears remote text with an empty local field", () => {
    const [entry] = planMetadata(
      { "en-US": { ...EMPTY_LISTING } },
      [{ locale: "en-US", version: { id: "v1", fields: { whatsNew: "Bug fixes" } } }],
      { infoEditable: true },
    );
    expect(entry.version.action).toBe("none");
  });

  it("marks name changes as blocked when no app info is editable", () => {
    const [entry] = planMetadata({ "en-US": listing }, [], { infoEditable: false });
    expect(entry.info.action).toBe("blocked");
    expect(hasChanges([{ ...entry, version: { action: "none", changes: [] } }])).toBe(false);
  });
});
