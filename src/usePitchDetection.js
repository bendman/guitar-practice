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

export const REQUIRED_FRAMES = 3;  // ~50ms at 60fps — gate handles most noise filtering now
export const ATTACK_RMS = 0.025;   // Gate arms when RMS exceeds this — a real pluck
export const RELEASE_RMS = 0.0015; // Gate disarms when RMS falls below this for N frames
export const RELEASE_FRAMES = 4;

const EMPTY_DEBUG = {
  freq: null, rms: 0, corr: 0, noteInfo: null,
  armed: false, releaseCount: 0, runCount: 0, matchedNoteId: null,
};

const initialState = () => ({ lastSeen: null, runCount: 0, armed: false, releaseCount: 0 });

// Apply the attack/release gate and stability counter to one frame.
// Mutates `st` in place. Returns the matched noteId, or null.
function processFrame(st, freq, rms) {
  if (!st.armed) {
    if (rms > ATTACK_RMS) {
      st.armed = true;
      st.releaseCount = 0;
    } else {
      return null; // Disarmed — ignore detections
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
  // Brief correlation gaps mid-note (noteId === null) don't reset the streak.
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

export function usePitchDetection(active, resetKey) {
  const [detectedNote, setDetectedNote] = useState(null);
  const stateRef = useRef(initialState());

  // Reset on deactivation via cleanup.
  useEffect(() => {
    if (!active) return;
    return () => {
      stateRef.current = initialState();
      setDetectedNote(null);
    };
  }, [active]);

  // Force disarm + clear detection whenever the target changes so the previous
  // note's decay can't register as a hit on the new target — the player must
  // produce a fresh attack.
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

export function useDebugPitch(active) {
  const [data, setData] = useState(EMPTY_DEBUG);
  const stateRef = useRef(initialState());

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
