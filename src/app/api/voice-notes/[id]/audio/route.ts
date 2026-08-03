import { Readable } from "node:stream";
import { getUser } from "@/lib/auth/session";
import { notFound, unauthorized } from "@/lib/http";
import { getVoiceNote } from "@/lib/data/voice";
import { fileStats, readFileRange } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Streams voice-note audio with HTTP Range support — iOS Safari's <audio>
 * element sends Range requests and won't scrub (sometimes won't play) without
 * 206 responses.
 */
export async function GET(request: Request, context: Ctx) {
  const user = await getUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const note = getVoiceNote(user.id, id);
  if (!note) return notFound();

  const stats = fileStats(note.filePath);
  if (!stats) return notFound();

  const size = stats.size;
  const baseHeaders: Record<string, string> = {
    "Content-Type": note.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  const rangeHeader = request.headers.get("range");
  const match = rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim()) : null;

  if (match && (match[1] || match[2])) {
    let start: number;
    let end: number;
    if (match[1]) {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else {
      // Suffix range: last N bytes.
      const suffix = Math.min(Number(match[2]), size);
      start = size - suffix;
      end = size - 1;
    }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const stream = readFileRange(note.filePath, start, end);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = readFileRange(note.filePath, 0, size - 1);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
