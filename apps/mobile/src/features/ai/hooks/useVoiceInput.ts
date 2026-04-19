import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type Status = 'idle' | 'starting' | 'listening' | 'stopping' | 'error';

interface UseVoiceInputOptions {
  lang?: string;
  onFinalTranscript?: (text: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { lang = 'en-US', onFinalTranscript } = options;
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const finalRef = useRef('');

  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
    setError(null);
    finalRef.current = '';
    setTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    setStatus('idle');
    if (finalRef.current) onFinalTranscript?.(finalRef.current);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const first = event.results?.[0];
    if (!first) return;
    const text = first.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) finalRef.current = text;
  });

  useSpeechRecognitionEvent('error', (event) => {
    setStatus('error');
    setError(event.error ?? 'speech_error');
  });

  const start = useCallback(async () => {
    try {
      setStatus('starting');
      setError(null);
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setStatus('error');
        setError('permission_denied');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });
    } catch (e: any) {
      setStatus('error');
      setError(e?.message ?? 'start_failed');
    }
  }, [lang]);

  const stop = useCallback(() => {
    setStatus('stopping');
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const toggle = useCallback(() => {
    if (status === 'listening' || status === 'starting') stop();
    else start();
  }, [status, start, stop]);

  return {
    status,
    isListening: status === 'listening' || status === 'starting',
    transcript,
    error,
    start,
    stop,
    toggle,
  };
}
