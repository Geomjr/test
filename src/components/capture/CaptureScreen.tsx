"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircleIcon,
  CircleIcon,
  MicIcon,
  PersonIcon,
  PlusIcon,
  WaveformIcon,
  XMarkIcon,
} from "@/components/ui/icons";
import type { InteractionType } from "@/lib/db/schema";

export type PickerContact = { id: string; name: string; detail: string };

type Candidate = { id: string; name: string; detail: string; confidence: number };
type NewPerson = { name: string; company: string | null; role: string | null };
type FollowUp = { title: string; due: string | null };
type Resolution = {
  ai: boolean;
  matches?: Candidate[];
  newPerson?: NewPerson | null;
  type?: InteractionType;
  date?: string | null;
  followUps?: FollowUp[];
};
type Chosen = { kind: "existing"; id: string; name: string } | { kind: "new" };

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

export function CaptureScreen({
  contacts,
  today,
}: {
  contacts: PickerContact[];
  today: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [text, setText] = useState("");
  const [person, setPerson] = useState<PickerContact | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [interim, setInterim] = useState("");
  const [hasAudio, setHasAudio] = useState(false);
  const [busy, setBusy] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  /** Where the picker result goes: the compose chip, a mid-save file-now, or the confirm sheet. */
  const pickerTarget = useRef<"chip" | "save" | "confirm">("chip");

  const [confirm, setConfirm] = useState<Resolution | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => teardownRecording(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function teardownRecording() {
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
  }

  async function startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast("Microphone access was denied");
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/mp4";
      blobRef.current = new Blob(chunksRef.current, { type });
      setHasAudio(true);
    };
    recorder.start(1000);
    setRecording(true);

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);

    // Live transcription lands in the note as you speak (not on iPhone,
    // where the mic can't be shared — the audio still saves).
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
          if (finals) setText((t) => (t + " " + finals).trim());
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
    speechRef.current = null;
    setInterim("");
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }

  function discardAudio() {
    blobRef.current = null;
    setHasAudio(false);
    setSeconds(0);
    secondsRef.current = 0;
  }

  const canSave = !recording && !busy && (text.trim().length > 0 || hasAudio);

  async function onSave() {
    const note = text.trim();
    setBusy(true);

    // No text to reason over (audio-only on iPhone): person must be picked.
    if (!note) {
      if (person) {
        await finalize({ kind: "existing", id: person.id, name: person.name }, null);
      } else {
        pickerTarget.current = "save";
        setPickerQuery("");
        setPickerOpen(true);
        setBusy(false);
      }
      return;
    }

    let resolution: Resolution | null = null;
    try {
      resolution = await api<Resolution>("/api/capture/resolve", { json: { text: note } });
    } catch {
      resolution = null;
    }

    if (!resolution?.ai) {
      // AI off or couldn't help — file directly or ask for the person.
      if (person) {
        await finalize({ kind: "existing", id: person.id, name: person.name }, null);
      } else {
        pickerTarget.current = "save";
        setPickerQuery("");
        setPickerOpen(true);
        setBusy(false);
      }
      return;
    }

    const followUps = resolution.followUps ?? [];
    if (person) {
      // User already said who — no need to ask unless there's more to confirm.
      if (followUps.length === 0) {
        await finalize({ kind: "existing", id: person.id, name: person.name }, resolution);
        return;
      }
      setChosen({ kind: "existing", id: person.id, name: person.name });
    } else {
      const top = resolution.matches?.[0];
      setChosen(top ? { kind: "existing", id: top.id, name: top.name } : null);
    }
    setChecked(followUps.map(() => true));
    setConfirm(resolution);
    setBusy(false);
  }

  async function finalize(who: Chosen, resolution: Resolution | null) {
    setBusy(true);
    const note = text.trim();
    try {
      let contactId: string;
      let contactName: string;
      if (who.kind === "existing") {
        contactId = who.id;
        contactName = who.name;
      } else {
        const np = confirm?.newPerson ?? resolution?.newPerson;
        if (!np) throw new Error("No person to create");
        const created = await api<{ contact: { id: string; name: string } }>(
          "/api/contacts",
          { json: { name: np.name, company: np.company, role: np.role } },
        );
        contactId = created.contact.id;
        contactName = created.contact.name;
      }

      await api("/api/interactions", {
        json: {
          contactId,
          type: resolution?.type ?? "other",
          date: resolution?.date ?? today,
          notes: note || null,
        },
      });

      if (blobRef.current) {
        const blob = blobRef.current;
        const type = blob.type.split(";")[0] || "audio/mp4";
        const ext = type.includes("webm") ? "webm" : type.includes("ogg") ? "ogg" : "m4a";
        const form = new FormData();
        form.append("file", new File([blob], `voice-note.${ext}`, { type }));
        form.append("durationSec", String(secondsRef.current));
        if (note) form.append("transcript", note);
        try {
          await api(`/api/contacts/${contactId}/voice-notes`, { form });
        } catch {
          toast("Note saved, but the audio upload failed");
        }
      }

      const followUps = resolution?.followUps ?? [];
      for (let i = 0; i < followUps.length; i++) {
        if (!checked[i] && confirm) continue; // unchecked in the confirm sheet
        const followUp = followUps[i];
        if (!followUp) continue;
        try {
          await api("/api/tasks", {
            json: { title: followUp.title, dueDate: followUp.due, contactId },
          });
        } catch {}
      }

      setText("");
      setPerson(null);
      setConfirm(null);
      setChosen(null);
      setChecked([]);
      discardAudio();
      toast(`Saved to ${contactName}`);
      router.refresh();
    } catch {
      toast("Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.detail}`.toLowerCase().includes(q);
  });

  const followUps = confirm?.followUps ?? [];
  const needsPerson = confirm !== null && chosen === null;

  return (
    <div>
      <div className="card overflow-hidden">
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Talked with Priya about her Bain offer — I promised to send her my case prep doc…"
          rows={6}
          className="w-full resize-none bg-transparent px-4 py-3.5 text-[16px] leading-relaxed outline-none placeholder:text-label-3"
        />
        {interim ? (
          <p className="px-4 pb-2 text-[15px] italic text-label-3">{interim}</p>
        ) : null}
        <div className="hairline-b hairline-full" />
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={() => {
              pickerTarget.current = "chip";
              setPickerQuery("");
              setPickerOpen(true);
            }}
            className={`pressable flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              person ? "bg-tint-soft text-tint" : "bg-fill text-label-2"
            }`}
          >
            <PersonIcon size={14} />
            {person ? person.name : "Person"}
            {person ? (
              <XMarkIcon
                size={13}
                onClick={(e) => {
                  e.stopPropagation();
                  setPerson(null);
                }}
              />
            ) : null}
          </button>
          {hasAudio && !recording ? (
            <span className="flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-label-2">
              <WaveformIcon size={14} />
              {fmtTimer(seconds)}
              <button type="button" onClick={discardAudio} aria-label="Discard recording">
                <XMarkIcon size={13} />
              </button>
            </span>
          ) : null}
          <span className="flex-1" />
          {recording ? (
            <span className="tnum text-[13px] font-semibold text-red">
              {fmtTimer(seconds)}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={recording ? "Stop recording" : "Record audio"}
            onClick={() => (recording ? stopRecording() : void startRecording())}
            className={`pressable flex h-[38px] w-[38px] items-center justify-center rounded-full ${
              recording ? "animate-pulse bg-red text-white" : "bg-fill text-tint"
            }`}
          >
            <MicIcon size={19} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <Button block disabled={!canSave} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* AI confirmation: who is this about + extracted follow-ups */}
      <Sheet
        open={confirm !== null}
        onClose={() => {
          setConfirm(null);
          setBusy(false);
        }}
        title={needsPerson || confirm?.matches?.length ? "Who was this about?" : "Save note"}
      >
        {confirm ? (
          <div className="pb-2">
            {!person ? (
              <div className="card overflow-hidden">
                {(confirm.matches ?? []).slice(0, 3).map((match) => (
                  <CandidateRow
                    key={match.id}
                    selected={chosen?.kind === "existing" && chosen.id === match.id}
                    onSelect={() =>
                      setChosen({ kind: "existing", id: match.id, name: match.name })
                    }
                    leading={<Avatar name={match.name} size={36} />}
                    title={match.name}
                    subtitle={match.detail || undefined}
                  />
                ))}
                {confirm.newPerson ? (
                  <CandidateRow
                    selected={chosen?.kind === "new"}
                    onSelect={() => setChosen({ kind: "new" })}
                    leading={
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-soft text-tint">
                        <PlusIcon size={18} />
                      </span>
                    }
                    title={`Add “${confirm.newPerson.name}”`}
                    subtitle={
                      [confirm.newPerson.role, confirm.newPerson.company]
                        .filter(Boolean)
                        .join(" · ") || "New contact"
                    }
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    pickerTarget.current = "confirm";
                    setPickerQuery("");
                    setPickerOpen(true);
                  }}
                  className="pressable-bg flex min-h-[50px] w-full items-center px-4 text-left text-[16px] text-tint"
                >
                  Someone else…
                </button>
              </div>
            ) : null}

            {followUps.length > 0 ? (
              <div className="mt-4">
                <p className="px-1.5 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-label-2">
                  Follow-ups
                </p>
                <div className="card overflow-hidden">
                  {followUps.map((followUp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))
                      }
                      className="hairline-b last:after:hidden flex min-h-[50px] w-full items-center gap-3 px-4 py-2 text-left"
                    >
                      <span className={checked[i] ? "text-tint" : "text-label-3"}>
                        {checked[i] ? <CheckCircleIcon size={22} /> : <CircleIcon size={22} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-snug">{followUp.title}</span>
                        {followUp.due ? (
                          <span className="text-[13px] text-label-2">Due {followUp.due}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <Button
                block
                disabled={busy || (!person && chosen === null)}
                onClick={() => {
                  const who = person
                    ? ({ kind: "existing", id: person.id, name: person.name } as const)
                    : chosen;
                  if (who) void finalize(who, confirm);
                }}
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>

      {/* Manual person picker */}
      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Who was this with?">
        <SearchBar
          value={pickerQuery}
          onValueChange={setPickerQuery}
          placeholder="Search people"
        />
        <div className="card mt-3 max-h-[50dvh] overflow-y-auto">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => {
                setPickerOpen(false);
                if (pickerTarget.current === "confirm") {
                  setChosen({ kind: "existing", id: contact.id, name: contact.name });
                } else if (pickerTarget.current === "save") {
                  // Mid-save manual path: file it to this person right away.
                  void finalize({ kind: "existing", id: contact.id, name: contact.name }, null);
                } else {
                  setPerson(contact);
                }
              }}
              className="hairline-b last:after:hidden pressable-bg flex min-h-[52px] w-full items-center gap-3 px-4 py-1.5 text-left"
            >
              <Avatar name={contact.name} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-medium">{contact.name}</span>
                {contact.detail ? (
                  <span className="block truncate text-[13px] text-label-2">
                    {contact.detail}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
          {filteredContacts.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-label-2">No matches.</p>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}

function CandidateRow({
  selected,
  onSelect,
  leading,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  leading: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="hairline-b last:after:hidden pressable-bg flex min-h-[52px] w-full items-center gap-3 px-4 py-1.5 text-left"
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium">{title}</span>
        {subtitle ? (
          <span className="block truncate text-[13px] text-label-2">{subtitle}</span>
        ) : null}
      </span>
      <span className={selected ? "text-tint" : "text-label-3"}>
        {selected ? <CheckCircleIcon size={22} /> : <CircleIcon size={22} />}
      </span>
    </button>
  );
}
