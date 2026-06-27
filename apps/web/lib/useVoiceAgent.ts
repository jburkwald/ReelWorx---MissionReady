'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VOICE_AGENT } from '@reelworx/shared';

// Voice for the spoken Story guide. Premium path = ElevenLabs (text-to-speech + Scribe
// speech-to-text) when ELEVENLABS_API_KEY is set on the server; otherwise the browser's
// built-in speechSynthesis + SpeechRecognition, so the keyless demo still talks and listens.
// The WORDS + profile extraction are always the existing Claude agent — this is only the
// mouth and ears. Delivery defaults come from VOICE_AGENT and the rate/pitch sliders.

// Minimal typings — the Web Speech API isn't in the standard TS DOM lib.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: { 0: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

export interface VoiceSettings {
  /** Selected browser voice (voiceURI), or null for the system default. */
  voiceURI: string | null;
  rate: number;
  pitch: number;
}

export interface VoiceProviderState {
  provider: string | null; // 'elevenlabs' when premium is live, else null
  tts: boolean;
  stt: boolean;
}

export interface VoiceAgent {
  /** Whether speaking/listening work at all (premium OR browser). */
  supported: { tts: boolean; stt: boolean };
  /** Premium provider status (drives the "HD voice" label). */
  premium: VoiceProviderState;
  voices: SpeechSynthesisVoice[];
  settings: VoiceSettings;
  setSettings: (patch: Partial<VoiceSettings>) => void;
  speaking: boolean;
  listening: boolean;
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  listen: (onResult: (transcript: string) => void) => void;
  stopListening: () => void;
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceAgent(): VoiceAgent {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const recognitionCtor = useMemo(getRecognitionCtor, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [premium, setPremium] = useState<VoiceProviderState>({ provider: null, tts: false, stt: false });
  const [settings, setSettingsState] = useState<VoiceSettings>({
    voiceURI: null,
    rate: VOICE_AGENT.delivery.rate,
    pitch: VOICE_AGENT.delivery.pitch,
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Is premium voice live on the server?
  useEffect(() => {
    let active = true;
    fetch('/api/voice/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: VoiceProviderState | null) => {
        if (active && d) setPremium({ provider: d.provider, tts: Boolean(d.tts), stt: Boolean(d.stt) });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load browser voices (async) and pick the best preferred match once.
  useEffect(() => {
    if (!synth) return;
    const load = () => {
      const list = synth.getVoices();
      if (list.length) {
        setVoices(list);
        setSettingsState((s) => {
          if (s.voiceURI) return s;
          const preferred = VOICE_AGENT.delivery.preferredVoices
            .map((name) => list.find((v) => v.name === name))
            .find(Boolean);
          const fallback = list.find((v) => v.lang?.startsWith('en')) ?? list[0];
          return { ...s, voiceURI: (preferred ?? fallback)?.voiceURI ?? null };
        });
      }
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, [synth]);

  const setSettings = useCallback((patch: Partial<VoiceSettings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const cancel = useCallback(() => {
    synth?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, [synth]);

  // Browser TTS (fallback).
  const browserSpeak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synth) {
        onEnd?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? VOICE_AGENT.delivery.lang;
      u.rate = settings.rate;
      u.pitch = settings.pitch;
      u.volume = VOICE_AGENT.delivery.volume;
      u.onstart = () => setSpeaking(true);
      u.onend = () => {
        setSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => {
        setSpeaking(false);
        onEnd?.();
      };
      synth.speak(u);
    },
    [synth, voices, settings.voiceURI, settings.rate, settings.pitch],
  );

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text.trim()) {
        onEnd?.();
        return;
      }
      cancel();
      if (!premium.tts) {
        browserSpeak(text, onEnd);
        return;
      }
      // Premium: speak the reply in the ElevenLabs voice; the rate slider maps to speed.
      setSpeaking(true);
      fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speed: settings.rate }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('premium tts unavailable');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          const done = () => {
            URL.revokeObjectURL(url);
            if (audioRef.current === audio) audioRef.current = null;
            setSpeaking(false);
            onEnd?.();
          };
          audio.onended = done;
          audio.onerror = done;
          await audio.play();
        })
        .catch(() => {
          // Network/key issue — fall back to the browser voice so it still speaks.
          browserSpeak(text, onEnd);
        });
    },
    [premium.tts, settings.rate, browserSpeak, cancel],
  );

  // Browser STT (fallback).
  const browserListen = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!recognitionCtor) return;
      synth?.cancel();
      const rec = new recognitionCtor();
      recognitionRef.current = rec;
      rec.lang = VOICE_AGENT.delivery.lang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript ?? '';
        if (transcript.trim()) onResult(transcript.trim());
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
    },
    [recognitionCtor, synth],
  );

  const listen = useCallback(
    (onResult: (transcript: string) => void) => {
      cancel(); // don't transcribe our own voice
      if (!premium.stt || typeof navigator === 'undefined' || !navigator.mediaDevices) {
        browserListen(onResult);
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const rec = new MediaRecorder(stream);
          recorderRef.current = rec;
          chunksRef.current = [];
          rec.ondataavailable = (e) => {
            if (e.data.size) chunksRef.current.push(e.data);
          };
          rec.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
            try {
              const form = new FormData();
              form.append('audio', blob, 'answer.webm');
              const res = await fetch('/api/voice/stt', { method: 'POST', body: form });
              if (res.ok) {
                const d = (await res.json()) as { text?: string };
                if (d.text?.trim()) onResult(d.text.trim());
              }
            } finally {
              recorderRef.current = null;
              setListening(false);
            }
          };
          setListening(true);
          rec.start();
        })
        .catch(() => browserListen(onResult));
    },
    [premium.stt, browserListen, cancel],
  );

  const stopListening = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop(); // triggers onstop -> transcribe
      return;
    }
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      synth?.cancel();
      audioRef.current?.pause();
      recognitionRef.current?.stop();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    };
  }, [synth]);

  return {
    supported: {
      tts: premium.tts || Boolean(synth),
      stt: premium.stt || Boolean(recognitionCtor),
    },
    premium,
    voices,
    settings,
    setSettings,
    speaking,
    listening,
    speak,
    cancel,
    listen,
    stopListening,
  };
}
