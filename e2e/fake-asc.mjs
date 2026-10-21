// A tiny in-memory stand-in for the App Store Connect API, covering the endpoints Framelane
// calls. Any bundle ID that starts with "com.example." exists, with version 1.0 being prepared.
// A Key ID of "REJECTED00" gets a 401. GET /__state returns everything for assertions.
import http from "node:http";

const port = Number(process.env.PORT ?? 3199);
const base = `http://127.0.0.1:${port}`;
const db = { apps: {}, versionLocs: {}, infoLocs: {}, sets: {}, shots: {}, uploads: {} };
let counter = 0;
const id = (prefix) => `${prefix}-${++counter}`;

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};
const list = (type, items) => ({ data: items.map(({ id, attributes }) => ({ type, id, attributes })) });

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function keyId(req) {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  try {
    return JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()).kid;
  } catch {
    return null;
  }
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, base);
    const path = url.pathname;
    const raw = await readBody(req);
    const body = raw.length && req.headers["content-type"]?.includes("json") ? JSON.parse(raw) : null;

    if (path === "/__state") return json(res, 200, db);
    if (path.startsWith("/upload/")) {
      db.uploads[path.split("/")[2]] = raw.length;
      return json(res, 200, {});
    }
    const kid = keyId(req);
    if (!kid) return json(res, 401, { errors: [{ title: "Missing token" }] });
    if (kid === "REJECTED00") return json(res, 401, { errors: [{ title: "NOT_AUTHORIZED" }] });

    let m;
    if (req.method === "GET" && path === "/v1/apps") {
      const bundleId = url.searchParams.get("filter[bundleId]");
      if (!bundleId) return json(res, 200, { data: [] });
      if (!bundleId.startsWith("com.example.")) return json(res, 200, { data: [] });
      db.apps[bundleId] ??= { id: id("app"), attributes: { name: bundleId.split(".").pop(), bundleId } };
      return json(res, 200, list("apps", [db.apps[bundleId]]));
    }
    if ((m = path.match(/^\/v1\/apps\/([^/]+)\/appStoreVersions$/))) {
      return json(res, 200, list("appStoreVersions", [{ id: `ver-${m[1]}`, attributes: { versionString: "1.0", appVersionState: "PREPARE_FOR_SUBMISSION" } }]));
    }
    if ((m = path.match(/^\/v1\/apps\/([^/]+)\/appInfos$/))) {
      return json(res, 200, list("appInfos", [{ id: `info-${m[1]}`, attributes: { state: "PREPARE_FOR_SUBMISSION" } }]));
    }
    if ((m = path.match(/^\/v1\/appStoreVersions\/([^/]+)\/appStoreVersionLocalizations$/))) {
      return json(res, 200, list("appStoreVersionLocalizations", Object.values(db.versionLocs).filter((l) => l.parent === m[1])));
    }
    if ((m = path.match(/^\/v1\/appInfos\/([^/]+)\/appInfoLocalizations$/))) {
      return json(res, 200, list("appInfoLocalizations", Object.values(db.infoLocs).filter((l) => l.parent === m[1])));
    }
    for (const [type, store, parentKey, parentRel] of [
      ["appStoreVersionLocalizations", db.versionLocs, "appStoreVersion", "ver"],
      ["appInfoLocalizations", db.infoLocs, "appInfo", "info"],
    ]) {
      if (req.method === "POST" && path === `/v1/${type}`) {
        const record = { id: id(parentRel + "loc"), parent: body.data.relationships[parentKey].data.id, attributes: body.data.attributes };
        store[record.id] = record;
        return json(res, 201, { data: { type, id: record.id, attributes: record.attributes } });
      }
      if (req.method === "PATCH" && (m = path.match(new RegExp(`^/v1/${type}/([^/]+)$`)))) {
        Object.assign(store[m[1]].attributes, body.data.attributes);
        return json(res, 200, { data: { type, id: m[1], attributes: store[m[1]].attributes } });
      }
    }
    if ((m = path.match(/^\/v1\/appStoreVersionLocalizations\/([^/]+)\/appScreenshotSets$/))) {
      return json(res, 200, list("appScreenshotSets", Object.values(db.sets).filter((s) => s.parent === m[1])));
    }
    if (req.method === "POST" && path === "/v1/appScreenshotSets") {
      const record = { id: id("set"), parent: body.data.relationships.appStoreVersionLocalization.data.id, attributes: body.data.attributes, order: [] };
      db.sets[record.id] = record;
      return json(res, 201, { data: { type: "appScreenshotSets", id: record.id, attributes: record.attributes } });
    }
    if ((m = path.match(/^\/v1\/appScreenshotSets\/([^/]+)\/appScreenshots$/))) {
      return json(res, 200, list("appScreenshots", Object.values(db.shots).filter((s) => s.parent === m[1])));
    }
    if (req.method === "PATCH" && (m = path.match(/^\/v1\/appScreenshotSets\/([^/]+)\/relationships\/appScreenshots$/))) {
      db.sets[m[1]].order = body.data.map((item) => item.id);
      return json(res, 204);
    }
    if (req.method === "POST" && path === "/v1/appScreenshots") {
      const shotId = id("shot");
      const { fileName, fileSize } = body.data.attributes;
      db.shots[shotId] = { id: shotId, parent: body.data.relationships.appScreenshotSet.data.id, attributes: { fileName, fileSize } };
      const half = Math.ceil(fileSize / 2);
      const uploadOperations = [
        { method: "PUT", url: `${base}/upload/${shotId}-a`, length: half, offset: 0, requestHeaders: [{ name: "Content-Type", value: "image/png" }] },
        { method: "PUT", url: `${base}/upload/${shotId}-b`, length: fileSize - half, offset: half, requestHeaders: [{ name: "Content-Type", value: "image/png" }] },
      ];
      return json(res, 201, { data: { type: "appScreenshots", id: shotId, attributes: { fileName, uploadOperations } } });
    }
    if ((m = path.match(/^\/v1\/appScreenshots\/([^/]+)$/))) {
      if (req.method === "DELETE") {
        delete db.shots[m[1]];
        return json(res, 204);
      }
      if (req.method === "PATCH") {
        Object.assign(db.shots[m[1]].attributes, body.data.attributes);
        return json(res, 200, { data: { type: "appScreenshots", id: m[1], attributes: db.shots[m[1]].attributes } });
      }
    }
    json(res, 404, { errors: [{ title: `No fake for ${req.method} ${path}` }] });
  })
  .listen(port, "127.0.0.1", () => console.log(`fake App Store Connect on ${base}`));
