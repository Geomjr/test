import { Readable } from "node:stream";
import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { getContact, setContactPhoto } from "@/lib/data/contacts";
import { deleteFile, fileStats, putFile, readFileRange } from "@/lib/storage";
import { newId } from "@/lib/ids";

type Ctx = { params: Promise<{ id: string }> };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

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
      "Cache-Control": "private, max-age=86400",
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

  const ext = EXT_BY_MIME[file.type];
  if (!ext) return badRequest("Unsupported image format.");

  const relPath = await putFile(
    user.id,
    "photos",
    newId(),
    ext,
    Buffer.from(await file.arrayBuffer()),
  );

  if (contact.photoPath) await deleteFile(contact.photoPath);
  setContactPhoto(user.id, id, relPath);
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const contact = getContact(user.id, id);
  if (!contact) return notFound();

  if (contact.photoPath) await deleteFile(contact.photoPath);
  setContactPhoto(user.id, id, null);
  return json({ ok: true });
}
