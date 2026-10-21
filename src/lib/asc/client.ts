import { createHash } from "node:crypto";
import { createAscToken, type AscCredentials } from "./jwt";

/**
 * A small App Store Connect API client covering what Framelane publishes: product page
 * text and screenshots. The base URL can be overridden to run against a fake server in tests.
 * https://developer.apple.com/documentation/appstoreconnectapi
 */

type Resource<A> = { type: string; id: string; attributes: A };
type Document<A> = { data: Resource<A>[]; links?: { next?: string } };
type Single<A> = { data: Resource<A> };

export type VersionLocalization = Resource<{
  locale: string;
  description?: string | null;
  keywords?: string | null;
  marketingUrl?: string | null;
  promotionalText?: string | null;
  supportUrl?: string | null;
  whatsNew?: string | null;
}>;

export type InfoLocalization = Resource<{
  locale: string;
  name?: string | null;
  subtitle?: string | null;
  privacyPolicyUrl?: string | null;
}>;

export type ScreenshotSet = Resource<{ screenshotDisplayType: string }>;
type UploadOperation = {
  method: string;
  url: string;
  length: number;
  offset: number;
  requestHeaders: { name: string; value: string }[];
};
type Screenshot = Resource<{ fileName: string; uploadOperations?: UploadOperation[] | null }>;

/** Versions in these states still accept metadata and screenshot changes. */
export const EDITABLE_STATES = new Set([
  "PREPARE_FOR_SUBMISSION",
  "DEVELOPER_REJECTED",
  "REJECTED",
  "METADATA_REJECTED",
  "INVALID_BINARY",
]);

export class AscError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function ascBaseUrl() {
  return process.env.FRAMELANE_ASC_URL ?? "https://api.appstoreconnect.apple.com";
}

export class AscClient {
  private token: { value: string; expires: number } | null = null;

  constructor(
    private readonly credentials: AscCredentials,
    private readonly baseUrl = ascBaseUrl(),
  ) {}

  // Apps and versions

  /** Cheapest authenticated call, used to check that the credentials work. */
  async ping() {
    await this.get<unknown>("/v1/apps?limit=1&fields[apps]=bundleId");
  }

  async findApp(bundleId: string) {
    const result = await this.get<{ name: string; bundleId: string }>(
      `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=1`,
    );
    return result.data[0] ?? null;
  }

  async findEditableVersion(appId: string) {
    const result = await this.get<{ versionString: string; appStoreState?: string; appVersionState?: string }>(
      `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=20`,
    );
    return (
      result.data.find((version) =>
        EDITABLE_STATES.has(version.attributes.appVersionState ?? version.attributes.appStoreState ?? ""),
      ) ?? null
    );
  }

  /** The app info that belongs to the version being prepared, if any. Name and subtitle live here. */
  async findEditableAppInfo(appId: string) {
    const result = await this.get<{ state?: string; appStoreState?: string }>(`/v1/apps/${appId}/appInfos`);
    return (
      result.data.find((info) => EDITABLE_STATES.has(info.attributes.state ?? info.attributes.appStoreState ?? "")) ??
      null
    );
  }

  // Localizations

  async versionLocalizations(versionId: string) {
    return this.getAll<VersionLocalization["attributes"]>(
      `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`,
    );
  }

  async infoLocalizations(appInfoId: string) {
    return this.getAll<InfoLocalization["attributes"]>(`/v1/appInfos/${appInfoId}/appInfoLocalizations?limit=50`);
  }

  async updateVersionLocalization(id: string, attributes: Partial<VersionLocalization["attributes"]>) {
    return this.send("PATCH", `/v1/appStoreVersionLocalizations/${id}`, {
      data: { type: "appStoreVersionLocalizations", id, attributes },
    });
  }

  async createVersionLocalization(versionId: string, attributes: VersionLocalization["attributes"]) {
    const result = await this.send<Single<VersionLocalization["attributes"]>>("POST", "/v1/appStoreVersionLocalizations", {
      data: {
        type: "appStoreVersionLocalizations",
        attributes,
        relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: versionId } } },
      },
    });
    return result.data;
  }

  async updateInfoLocalization(id: string, attributes: Partial<InfoLocalization["attributes"]>) {
    return this.send("PATCH", `/v1/appInfoLocalizations/${id}`, {
      data: { type: "appInfoLocalizations", id, attributes },
    });
  }

  async createInfoLocalization(appInfoId: string, attributes: InfoLocalization["attributes"]) {
    return this.send("POST", "/v1/appInfoLocalizations", {
      data: {
        type: "appInfoLocalizations",
        attributes,
        relationships: { appInfo: { data: { type: "appInfos", id: appInfoId } } },
      },
    });
  }

  // Screenshots

  async screenshotSets(localizationId: string) {
    return this.getAll<ScreenshotSet["attributes"]>(
      `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=50`,
    );
  }

  async screenshots(setId: string) {
    return this.getAll<Screenshot["attributes"]>(`/v1/appScreenshotSets/${setId}/appScreenshots?limit=50`);
  }

  async createScreenshotSet(localizationId: string, displayType: string) {
    const result = await this.send<Single<ScreenshotSet["attributes"]>>("POST", "/v1/appScreenshotSets", {
      data: {
        type: "appScreenshotSets",
        attributes: { screenshotDisplayType: displayType },
        relationships: {
          appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: localizationId } },
        },
      },
    });
    return result.data;
  }

  async deleteScreenshot(id: string) {
    await this.send("DELETE", `/v1/appScreenshots/${id}`);
  }

  /** Reserves, uploads and commits one screenshot, following Apple's upload operations. */
  async uploadScreenshot(setId: string, fileName: string, bytes: Uint8Array) {
    const reserved = await this.send<Single<Screenshot["attributes"]>>("POST", "/v1/appScreenshots", {
      data: {
        type: "appScreenshots",
        attributes: { fileName, fileSize: bytes.byteLength },
        relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } } },
      },
    });
    for (const operation of reserved.data.attributes.uploadOperations ?? []) {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: Object.fromEntries(operation.requestHeaders.map((header) => [header.name, header.value])),
        body: bytes.slice(operation.offset, operation.offset + operation.length),
      });
      if (!response.ok) throw new AscError(`Uploading ${fileName} failed (${response.status})`, response.status);
    }
    await this.send("PATCH", `/v1/appScreenshots/${reserved.data.id}`, {
      data: {
        type: "appScreenshots",
        id: reserved.data.id,
        attributes: { uploaded: true, sourceFileChecksum: createHash("md5").update(bytes).digest("hex") },
      },
    });
    return reserved.data.id;
  }

  async orderScreenshots(setId: string, ids: string[]) {
    await this.send("PATCH", `/v1/appScreenshotSets/${setId}/relationships/appScreenshots`, {
      data: ids.map((id) => ({ type: "appScreenshots", id })),
    });
  }

  // Transport

  private authorization() {
    const now = Date.now();
    if (!this.token || this.token.expires - now < 60_000) {
      this.token = { value: createAscToken(this.credentials, now), expires: now + 15 * 60_000 };
    }
    return `Bearer ${this.token.value}`;
  }

  private async get<A>(path: string) {
    return this.send<Document<A>>("GET", path);
  }

  private async getAll<A>(path: string) {
    const items: Resource<A>[] = [];
    let next: string | undefined = path;
    while (next) {
      const page: Document<A> = await this.send<Document<A>>("GET", next);
      items.push(...page.data);
      next = page.links?.next;
    }
    return items;
  }

  private async send<T = unknown>(method: string, pathOrUrl: string, body?: unknown): Promise<T> {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.authorization(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response
        .json()
        .then((json: { errors?: { title?: string; detail?: string }[] }) =>
          json.errors?.map((error) => error.detail ?? error.title).join(" "),
        )
        .catch(() => "");
      throw new AscError(detail || `App Store Connect returned ${response.status}`, response.status);
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  }
}
