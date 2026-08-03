"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { Button } from "@/components/ui/Button";
import { ListSection } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { MicIcon, PencilIcon, WaveformIcon } from "@/components/ui/icons";
import { AudioPlayer } from "./AudioPlayer";
import { formatDate } from "@/lib/dates";

export type VoiceNoteRow = {
  id: string;
  durationSec: number | null;
  transcript: string | null;
  createdAt: number;
};

/* Minimal Web Speech typings — the lib.dom ones aren't shipped everywhere. */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function speechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** iOS can't reliably run SpeechRecognition and MediaRecorder on one mic. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent);
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const candidate of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return undefined;
}

const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function VoiceNotes({
  contactId,
  notes,
}: {
  contactId: string;
  notes: VoiceNoteRow[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [recorderOpen, setRecorderOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "recording" | "preview" | "denied">("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [menuFor, setMenuFor] = useState<VoiceNoteRow | null>(null);
  const [editFor, setEditFor] = useState<VoiceNoteRow | null>(null);
  const [editText, setEditText] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      speechRef.current?.stop();
    } catch {}
    speechRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }

  async function beginRecording() {
    setTranscript("");
    setInterim("");
    setSeconds(0);
    secondsRef.current = 0;
    blobRef.current = null;
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase("denied");
      return;
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/mp4";
      const blob = new Blob(chunksRef.current, { type });
      blobRef.current = blob;
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setPhase("preview");
    };
    recorder.start(1000);
    setPhase("recording");

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);

    // Live transcription is best-effort: Chrome/Edge support it well; on
    // iPhone the mic can't be shared, so we record only and let the user type.
    const Ctor = speechRecognitionCtor();
    if (Ctor && !isIOS()) {
      try {
        const speech = new Ctor();
        speech.continuous = true;
        speech.interimResults = true;
        speech.lang = navigator.language || "en-US";
        speech.onresult = (event) => {
          let finals = "";
          let interims = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (!result) continue;
            if (result.isFinal) finals += result[0].transcript;
            else interims += result[0].transcript;
          }
          if (finals) setTranscript((t) => (t + " " + finals).trim());
          setInterim(interims);
        };
        speech.onerror = () => setInterim("");
        speech.start();
        speechRef.current = speech;
      } catch {
        speechRef.current = null;
      }
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      speechRef.current?.stop();
    } catch {}
    setInterim("");
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function save() {
    const blob = blobRef.current;
    if (!blob) return;
    setBusy(true);
    try {
      const type = blob.type.split(";")[0] || "audio/mp4";
      const ext = type.includes("webm") ? "webm" : type.includes("ogg") ? "ogg" : "m4a";
      const form = new FormData();
      form.append("file", new File([blob], `voice-note.${ext}`, { type }));
      form.append("durationSec", String(secondsRef.current));
      if (transcript.trim()) form.append("transcript", transcript.trim());
      await api(`/api/contacts/${contactId}/voice-notes`, { form });
      closeRecorder();
      toast("Voice note saved");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  function closeRecorder() {
    cleanup();
    setPreviewUrl(null);
    setRecorderOpen(false);
    setPhase("idle");
    setBusy(false);
  }

  return (
    <ListSection
      title="Voice Notes"
      action={
        <button
          type="button"
          onClick={() => {
            setRecorderOpen(true);
            setPhase("idle");
          }}
          className="pressable flex items-center gap-1 text-[14px] font-semibold text-tint"
        >
          <MicIcon size={16} strokeWidth={2.2} /> Record
        </button>
      }
    >
      {notes.length === 0 ? (
        <div className="px-4 py-4 text-[14px] text-label-2">
          Capture a memo right after a chat — Orbit transcribes it where the
          browser allows, and transcripts are searchable.
        </div>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="hairline-b last:after:hidden px-4 py-3">
            <div className="flex items-center justify-between pb-2">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-label-2">
                <WaveformIcon size={14} />
                {formatDate(new Date(note.createdAt).toISOString().slice(0, 10))}
              </span>
              <button
                type="button"
                onClick={() => setMenuFor(note)}
                className="pressable px-2 text-[13px] font-medium text-tint"
              >
                Edit
              </button>
            </div>
            <AudioPlayer src={`/api/voice-notes/${note.id}/audio`} durationSec={note.durationSec} />
            {note.transcript ? (
              <p className="pt-2 text-[14px] leading-snug text-label-2">{note.transcript}</p>
            ) : null}
          </div>
        ))
      )}

      {/* Row actions */}
      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        actions={[
          {
            label: menuFor?.transcript ? "Edit Transcript" : "Add Transcript",
            onSelect: () => {
              if (!menuFor) return;
              setEditText(menuFor.transcript ?? "");
              setEditFor(menuFor);
            },
          },
          {
            label: "Delete Voice Note",
            destructive: true,
            onSelect: () => {
              if (!menuFor) return;
              void api(`/api/voice-notes/${menuFor.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />

      {/* Transcript editor */}
      <Sheet
        open={editFor !== null}
        onClose={() => setEditFor(null)}
        title="Transcript"
        right={
          <button
            type="button"
            className="pressable px-3 text-[17px] font-semibold text-tint"
            onClick={() => {
              if (!editFor) return;
              void api(`/api/voice-notes/${editFor.id}`, {
                method: "PATCH",
                json: { transcript: editText || null },
              }).then(() => {
                setEditFor(null);
                router.refresh();
              });
            }}
          >
            Save
          </button>
        }
      >
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={10}
          autoFocus
          placeholder="What was said…"
          className="w-full rounded-[10px] bg-card p-3 text-[16px] outline-none"
        />
      </Sheet>

      {/* Recorder */}
      <Sheet open={recorderOpen} onClose={closeRecorder} title="Voice Note">
        {phase === "denied" ? (
          <div className="py-8 text-center">
            <p className="text-[17px] font-semibold">Microphone access needed</p>
            <p className="pt-1 text-[14px] text-label-2">
              Allow microphone access for this site in your browser settings, then try again.
            </p>
          </div>
        ) : phase === "preview" ? (
          <div className="flex flex-col gap-4">
            {previewUrl ? (
              <div className="rounded-[10px] bg-card px-4 py-3">
                <AudioPlayer src={previewUrl} durationSec={secondsRef.current} />
              </div>
            ) : null}
            <div>
              <p className="pb-1 text-[13px] font-medium text-label-2">
                Transcript — edit or type it yourself
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={6}
                placeholder="No transcript captured — type one so it's searchable."
                className="w-full rounded-[10px] bg-card p-3 text-[16px] outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="gray" block onClick={() => void beginRecording()}>
                Re-record
              </Button>
              <Button block loading={busy} onClick={() => void save()}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-6">
            <p className="tnum text-[40px] font-bold tracking-tight">{fmtTimer(seconds)}</p>
            {phase === "recording" ? (
              <>
                <p className="min-h-[40px] max-w-[300px] text-center text-[14px] text-label-2">
                  {(transcript + " " + interim).trim() || "Listening…"}
                </p>
                <button
                  type="button"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  className="pressable animate-pulse-rec flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red"
                >
                  <span className="h-7 w-7 rounded-[6px] bg-white" />
                </button>
                <p className="text-[13px] text-label-2">Tap to stop</p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void beginRecording()}
                  aria-label="Start recording"
                  className="pressable flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red text-white"
                >
                  <MicIcon size={34} strokeWidth={2} />
                </button>
                <p className="max-w-[280px] text-center text-[13px] text-label-2">
                  Tap to record. On supported browsers Orbit transcribes as you
                  speak; you can always edit the text after.
                </p>
              </>
            )}
          </div>
        )}
      </Sheet>
    </ListSection>
  );
}
