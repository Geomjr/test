import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { contactOwned, createVoiceNote, newVoiceNoteId } from "@/lib/data/voice";
import { deleteFile, putFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

// iOS Safari records audio/mp4 (AAC); Chrome records audio/webm (Opus).
const EXT_BY_MIME: [RegExp, string][] = [
  [/^audio\/mp4/, "m4a"],
  [/^audio\/webm/, "webm"],
  [/^audio\/mpeg/, "mp3"],
  [/^audio\/ogg/, "ogg"],
  [/^audio\/wav/, "wav"],
  [/^audio\/aac/, "aac"],
];

export async function POST(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id: contactId } = await context.params;

  if (!contactOwned(user.id, contactId)) return notFound();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Attach a recording.");
  if (file.size === 0) return badRequest("The recording is empty.");
  if (file.size > MAX_AUDIO_BYTES) return badRequest("Recordings are capped at 25 MB.");

  const mime = file.type.split(";")[0]?.trim() || "audio/mp4";
  const ext = EXT_BY_MIME.find(([re]) => re.test(mime))?.[1];
  if (!ext) return badRequest("Unsupported audio format.");

  const durationRaw = Number(form?.get("durationSec"));
  const transcriptRaw = form?.get("transcript");
  const transcript =
    typeof transcriptRaw === "string" && transcriptRaw.trim()
      ? transcriptRaw.trim().slice(0, 50_000)
      : null;

  const noteId = newVoiceNoteId();
  const relPath = await putFile(
    user.id,
    "voice",
    noteId,
    ext,
    Buffer.from(await file.arrayBuffer()),
  );

  let note;
  try {
    note = createVoiceNote({
      id: noteId,
      userId: user.id,
      contactId,
      filePath: relPath,
      mimeType: mime,
      durationSec: Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null,
      transcript,
      createdAt: Date.now(),
    });
  } catch (error) {
    await deleteFile(relPath); // don't orphan the upload
    throw error;
  }

  return json({ voiceNote: note }, 201);
}
