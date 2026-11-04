"use client";

// Voice notes for the concierge (FR-05: accept voice notes, reply in text).
// The website widget transcribes in the browser with the Web Speech API
// (Chrome, Edge, Safari). On WhatsApp the Cloud API delivers the audio file
// instead, and a speech-to-text service transcribes it server-side; either
// way the concierge only ever sees the transcript.

import { useRef, useState, useSyncExternalStore } from "react";
import type { Language } from "@/lib/types";

/** The slice of the Web Speech API we use; TypeScript's DOM lib doesn't ship it. */
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

const SPEECH_LANG: Record<Language, string> = { en: "en-GB", id: "id-ID", nl: "nl-NL", ru: "ru-RU", es: "es-ES" };

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noop = () => () => {};

export function useVoiceNote(onTranscript: (text: string, durationSec: number) => void) {
  const supported = useSyncExternalStore(noop, () => Boolean(recognitionCtor()), () => false);
  const [recording, setRecording] = useState<{ startedAt: number; interim: string }>();
  const [error, setError] = useState<string>();
  const rec = useRef<Recognition | undefined>(undefined);
  const cancelled = useRef(false);

  const start = (language: Language) => {
    const Ctor = recognitionCtor();
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.lang = SPEECH_LANG[language];
    r.continuous = true;
    r.interimResults = true;
    const startedAt = Date.now();
    let final = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }
      setRecording({ startedAt, interim: (final + interim).trim() });
    };
    r.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(e.error === "not-allowed" ? "Microphone access was blocked." : "Couldn't hear that. Try again or type your message.");
    };
    r.onend = () => {
      rec.current = undefined;
      setRecording(undefined);
      const text = final.trim();
      if (!cancelled.current && text) onTranscript(text, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
      cancelled.current = false;
    };
    cancelled.current = false;
    setError(undefined);
    setRecording({ startedAt, interim: "" });
    rec.current = r;
    r.start();
  };

  /** Stop listening and send what was heard. */
  const stop = () => rec.current?.stop();

  /** Stop listening and discard. */
  const cancel = () => {
    cancelled.current = true;
    rec.current?.abort();
  };

  return { supported, recording, error, start, stop, cancel };
}

export function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
