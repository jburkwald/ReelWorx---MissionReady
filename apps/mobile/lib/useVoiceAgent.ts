import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import {
  createAudioPlayer,
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { VOICE_AGENT } from '@reelworx/shared';
import { API_URL } from './api';

// Voice for the spoken Story guide on mobile. Premium = ElevenLabs (HD TTS streamed from
// /api/voice/tts, STT recorded with expo-audio then sent to /api/voice/stt). When no key is
// set on the server, TTS falls back to the device's expo-speech voice; on-device STT isn't
// available, so the mic only appears when premium STT is live. Claude remains the brain.

export interface MobileVoiceAgent {
  premium: { provider: string | null; tts: boolean; stt: boolean };
  supported: { tts: boolean; stt: boolean };
  speaking: boolean;
  listening: boolean;
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  /** Begin capturing a spoken answer; the transcript is delivered to onResult on stop. */
  listen: (onResult: (transcript: string) => void) => void;
  stopListening: () => void;
}

export function useVoiceAgent(): MobileVoiceAgent {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [premium, setPremium] = useState<MobileVoiceAgent['premium']>({
    provider: null,
    tts: false,
    stt: false,
  });
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const onResultRef = useRef<((t: string) => void) | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/voice/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MobileVoiceAgent['premium'] | null) => {
        if (active && d) setPremium({ provider: d.provider, tts: Boolean(d.tts), stt: Boolean(d.stt) });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const cancel = useCallback(() => {
    Speech.stop();
    if (playerRef.current) {
      playerRef.current.remove();
      playerRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text.trim()) {
        onEnd?.();
        return;
      }
      cancel();
      if (premium.tts) {
        // Stream the HD voice straight from the API by URL.
        const url = `${API_URL}/voice/tts?text=${encodeURIComponent(text)}&speed=${VOICE_AGENT.delivery.rate}`;
        const player = createAudioPlayer({ uri: url });
        playerRef.current = player;
        setSpeaking(true);
        const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
          if (status.didJustFinish) {
            sub.remove();
            if (playerRef.current === player) playerRef.current = null;
            player.remove();
            setSpeaking(false);
            onEnd?.();
          }
        });
        player.play();
      } else {
        // Device voice fallback (no key).
        setSpeaking(true);
        Speech.speak(text, {
          language: VOICE_AGENT.delivery.lang,
          rate: VOICE_AGENT.delivery.rate,
          pitch: VOICE_AGENT.delivery.pitch,
          onDone: () => {
            setSpeaking(false);
            onEnd?.();
          },
          onStopped: () => setSpeaking(false),
          onError: () => {
            setSpeaking(false);
            onEnd?.();
          },
        });
      }
    },
    [premium.tts, cancel],
  );

  const listen = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!premium.stt) return; // no on-device STT; mic is hidden unless premium is live
      onResultRef.current = onResult;
      cancel();
      (async () => {
        try {
          const perm = await requestRecordingPermissionsAsync();
          if (!perm.granted) return;
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
          await recorder.prepareToRecordAsync();
          recorder.record();
          setListening(true);
        } catch {
          setListening(false);
        }
      })();
    },
    [premium.stt, recorder, cancel],
  );

  const stopListening = useCallback(() => {
    (async () => {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          const form = new FormData();
          // React Native file-upload shape.
          form.append('audio', { uri, name: 'answer.m4a', type: 'audio/m4a' } as unknown as Blob);
          const res = await fetch(`${API_URL}/voice/stt`, { method: 'POST', body: form });
          if (res.ok) {
            const d = (await res.json()) as { text?: string };
            if (d.text?.trim()) onResultRef.current?.(d.text.trim());
          }
        }
      } catch {
        /* ignore — keep typing available */
      } finally {
        setListening(false);
      }
    })();
  }, [recorder]);

  useEffect(() => {
    return () => {
      Speech.stop();
      playerRef.current?.remove();
    };
  }, []);

  return {
    premium,
    supported: { tts: true, stt: premium.stt },
    speaking,
    listening,
    speak,
    cancel,
    listen,
    stopListening,
  };
}
