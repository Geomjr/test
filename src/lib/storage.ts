import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "@/lib/db";

/**
 * Uploaded files live under DATA_DIR/uploads/{userId}/{kind}/{id}.{ext},
 * outside `public/`, and are only served through auth-checked routes.
 * The four-function surface keeps an S3 swap a drop-in change later.
 */

const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;
const SAFE_EXT = /^[a-z0-9]{1,8}$/;

function resolveSafe(relPath: string): string {
  const root = uploadsDir();
  const full = path.resolve(root, relPath);
  if (!full.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return full;
}

export async function putFile(
  userId: string,
  kind: "photos" | "voice",
  id: string,
  ext: string,
  data: Buffer,
): Promise<string> {
  if (!SAFE_SEGMENT.test(userId) || !SAFE_SEGMENT.test(id) || !SAFE_EXT.test(ext)) {
    throw new Error("Invalid storage key");
  }
  const rel = path.join(userId, kind, `${id}.${ext}`);
  const full = resolveSafe(rel);
  await fsp.mkdir(path.dirname(full), { recursive: true });
  await fsp.writeFile(full, data);
  return rel;
}

export function fileStats(relPath: string): { size: number; full: string } | null {
  try {
    const full = resolveSafe(relPath);
    const stat = fs.statSync(full);
    return stat.isFile() ? { size: stat.size, full } : null;
  } catch {
    return null;
  }
}

export function readFileRange(
  relPath: string,
  start: number,
  end: number,
): fs.ReadStream {
  return fs.createReadStream(resolveSafe(relPath), { start, end });
}

export async function deleteFile(relPath: string): Promise<void> {
  try {
    await fsp.unlink(resolveSafe(relPath));
  } catch {
    // Already gone — fine.
  }
}
