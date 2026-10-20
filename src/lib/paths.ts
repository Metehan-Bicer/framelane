import path from "node:path";

export const dataDir = process.env.FRAMELANE_DATA_DIR ?? path.join(process.cwd(), "data");
export const uploadsDir = path.join(dataDir, "uploads");
