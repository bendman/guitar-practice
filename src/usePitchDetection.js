import { useEffect, useRef, useState } from "react";
import { detectPitch, freqToNoteId, freqToNoteInfo } from "./pitch";

// Set up mic + AnalyserNode + RAF loop while `active`. Calls onFrame(buffer, sampleRate)
// every animation frame. Cleans up stream/context on deactivation or unmount.
function useMicLoop(active, onFrame) {
  // Keep latest onFrame in a ref so we don't rebuild the audio graph each render.
  const onFrameRef = useRef(onFrame);
  useEffect(() => { onFrameRef.current = onFrame; });

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = null;
    let ctx = null;
    let stream = null;

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
          onFrameRef.current(buffer, ctx.sampleRate);
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (ctx) ctx.close().catch(() => {});
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [active]);
}

const REQUIRED_FRAMES = 5; // ~83ms at 60fps — filters harmonics and transients
const EMPTY_DEBUG = { freq: null, rms: 0, corr: 0, noteInfo: null };

export function usePitchDetection(active) {
  const [detectedNote, setDetectedNote] = useState(null);
  const stateRef = useRef({ lastSeen: null, runCount: 0 });

  // Reset on deactivation via cleanup.
  useEffect(() => {
    if (!active) return;
    return () => {
      stateRef.current = { lastSeen: null, runCount: 0 };
      setDetectedNote(null);
    };
  }, [active]);

  useMicLoop(active, (buffer, sampleRate) => {
    const { freq } = detectPitch(buffer, sampleRate);
    const noteId = freq ? freqToNoteId(freq) : null;
    const st = stateRef.current;
    if (noteId !== null && noteId === st.lastSeen) {
      st.runCount++;
    } else {
      st.lastSeen = noteId;
      st.runCount = noteId !== null ? 1 : 0;
    }
    setDetectedNote(st.runCount >= REQUIRED_FRAMES ? noteId : null);
  });

  return detectedNote;
}

export function useDebugPitch(active) {
  const [data, setData] = useState(EMPTY_DEBUG);

  useEffect(() => {
    if (!active) return;
    return () => setData(EMPTY_DEBUG);
  }, [active]);

  useMicLoop(active, (buffer, sampleRate) => {
    const { freq, rms, corr } = detectPitch(buffer, sampleRate);
    setData({ freq, rms, corr, noteInfo: freq ? freqToNoteInfo(freq) : null });
  });

  return data;
}
