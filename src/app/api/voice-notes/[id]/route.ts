import { getUser } from "@/lib/auth/session";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { voicePatch } from "@/lib/validation";
import { deleteVoiceNote, updateTranscript } from "@/lib/data/voice";
import { deleteFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const parsed = voicePatch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const transcript = parsed.data.transcript?.trim() || null;
  const note = updateTranscript(user.id, id, transcript);
  if (!note) return notFound();
  return json({ voiceNote: note });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const filePath = deleteVoiceNote(user.id, id);
  if (filePath === null) return notFound();
  await deleteFile(filePath);
  return json({ ok: true });
}
