import { Readable } from "node:stream";
import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { getContact, setContactPhoto } from "@/lib/data/contacts";
import { deleteFile, fileStats, putFile, readFileRange } from "@/lib/storage";
import { newId } from "@/lib/ids";

type Ctx = { params: Promise<{ id: string }> };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

/** Determine the actual image type from magic bytes — never trust client MIME. */
function sniffImage(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP")
    return "webp";
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return "gif";
  // ISO-BMFF: ....ftypheic / heix / mif1 etc. (iPhone photos)
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "mif1", "msf1", "heif"].includes(brand)) return "heic";
  }
  return null;
}

export async function GET(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const contact = getContact(user.id, id);
  if (!contact?.photoPath) return notFound();

  const stats = fileStats(contact.photoPath);
  if (!stats) return notFound();

  const ext = contact.photoPath.split(".").pop() ?? "jpg";
  const stream = readFileRange(contact.photoPath, 0, stats.size - 1);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Content-Length": String(stats.size),
      // Callers append ?v=<updatedAt>, so long caching is safe: any photo
      // change bumps updatedAt and produces a fresh URL.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const contact = getContact(user.id, id);
  if (!contact) return notFound();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Attach an image file.");
  if (file.size > MAX_PHOTO_BYTES) return badRequest("Photos are capped at 5 MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(buffer);
  if (!ext) return badRequest("Unsupported image format.");

  // Write the new file, point the DB at it, and only then delete the old one —
  // a failure at any step never leaves the contact referencing a missing file.
  const relPath = await putFile(user.id, "photos", newId(), ext, buffer);
  try {
    setContactPhoto(user.id, id, relPath);
  } catch (error) {
    await deleteFile(relPath);
    throw error;
  }
  if (contact.photoPath) await deleteFile(contact.photoPath);
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const contact = getContact(user.id, id);
  if (!contact) return notFound();

  setContactPhoto(user.id, id, null);
  if (contact.photoPath) await deleteFile(contact.photoPath);
  return json({ ok: true });
}
