import { useEffect, useRef, useState } from "react";
import { detectPitch, freqToNoteId, freqToNoteInfo, type NoteInfo } from "./pitch";

interface PitchGateState {
  lastSeen: string | null;
  runCount: number;
  armed: boolean;
  releaseCount: number;
}

export interface DebugPitchData {
  freq: number | null;
  rms: number;
  corr: number;
  noteInfo: NoteInfo | null;
  armed: boolean;
  releaseCount: number;
  runCount: number;
  matchedNoteId: string | null;
}

function useMicLoop(active: boolean, onFrame: (buffer: Float32Array, sampleRate: number) => void): void {
  const onFrameRef = useRef(onFrame);
  useEffect(() => { onFrameRef.current = onFrame; });

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId: number | null = null;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        source.connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);

        const loop = () => {
          if (cancelled) return;
          analyser.getFloatTimeDomainData(buffer);
          onFrameRef.current(buffer, ctx!.sampleRate);
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (ctx) ctx.close().catch(() => {});
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [active]);
}

export const REQUIRED_FRAMES = 3;
export const ATTACK_RMS = 0.025;
export const RELEASE_RMS = 0.0015;
export const RELEASE_FRAMES = 4;

const EMPTY_DEBUG: DebugPitchData = {
  freq: null, rms: 0, corr: 0, noteInfo: null,
  armed: false, releaseCount: 0, runCount: 0, matchedNoteId: null,
};

const initialState = (): PitchGateState => ({ lastSeen: null, runCount: 0, armed: false, releaseCount: 0 });

function processFrame(st: PitchGateState, freq: number | null, rms: number): string | null {
  if (!st.armed) {
    if (rms > ATTACK_RMS) {
      st.armed = true;
      st.releaseCount = 0;
    } else {
      return null;
    }
  } else if (rms < RELEASE_RMS) {
    st.releaseCount++;
    if (st.releaseCount >= RELEASE_FRAMES) {
      st.armed = false;
      st.lastSeen = null;
      st.runCount = 0;
      return null;
    }
  } else {
    st.releaseCount = 0;
  }

  const noteId = freq ? freqToNoteId(freq) : null;
  if (noteId !== null) {
    if (noteId === st.lastSeen) {
      st.runCount++;
    } else {
      st.lastSeen = noteId;
      st.runCount = 1;
    }
  }
  return st.runCount >= REQUIRED_FRAMES ? st.lastSeen : null;
}

export function usePitchDetection(active: boolean, resetKey: number): string | null {
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const stateRef = useRef<PitchGateState>(initialState());

  useEffect(() => {
    if (!active) return;
    return () => {
      stateRef.current = initialState();
      setDetectedNote(null);
    };
  }, [active]);

  useEffect(() => {
    stateRef.current = initialState();
    setDetectedNote(null);
  }, [resetKey]);

  useMicLoop(active, (buffer, sampleRate) => {
    const { freq, rms } = detectPitch(buffer, sampleRate);
    setDetectedNote(processFrame(stateRef.current, freq, rms));
  });

  return detectedNote;
}

export function useDebugPitch(active: boolean): DebugPitchData {
  const [data, setData] = useState<DebugPitchData>(EMPTY_DEBUG);
  const stateRef = useRef<PitchGateState>(initialState());

  useEffect(() => {
    if (!active) return;
    return () => {
      stateRef.current = initialState();
      setData(EMPTY_DEBUG);
    };
  }, [active]);

  useMicLoop(active, (buffer, sampleRate) => {
    const { freq, rms, corr } = detectPitch(buffer, sampleRate);
    const matchedNoteId = processFrame(stateRef.current, freq, rms);
    const st = stateRef.current;
    setData({
      freq, rms, corr,
      noteInfo: freq ? freqToNoteInfo(freq) : null,
      armed: st.armed,
      releaseCount: st.releaseCount,
      runCount: st.runCount,
      matchedNoteId,
    });
  });

  return data;
}
