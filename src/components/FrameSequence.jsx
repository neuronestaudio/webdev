import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 240;
// The source video loops back to aerial at the very end. We stop on
// the "interior stillness" beat (~t=9.5s = frame index 228) and ignore
// the trailing loop-back frames.
const MAX_FRAME_INDEX = 228;
// Fraction of scroll spent scrubbing. The remainder holds the final
// frame still on screen so the user has a beat to absorb the interior.
const SCRUB_END = 0.92;
const framePath = (i) => `/frames/f${String(i).padStart(3, "0")}.webp`;

export default function FrameSequence({ progressRef, onReady }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const framesRef = useRef([]);
  const lastIdxRef = useRef(-1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [loadedPct, setLoadedPct] = useState(0);
  const [firstFramePainted, setFirstFramePainted] = useState(false);

  // Preload all frames.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const images = new Array(FRAME_COUNT);

    const onAllReady = () => {
      if (cancelled) return;
      onReady?.();
    };

    // Load frames in priority order: first frame, last frame, then fill
    // in evenly across the sequence so partial coverage still looks
    // believable while the rest loads.
    const order = [];
    order.push(0, FRAME_COUNT - 1);
    for (let stride = FRAME_COUNT / 2; stride >= 1; stride = Math.floor(stride / 2)) {
      for (let i = 0; i < FRAME_COUNT; i += stride) {
        if (!order.includes(i)) order.push(i);
      }
      if (stride === 1) break;
    }
    // Append any missed indices.
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (!order.includes(i)) order.push(i);
    }

    order.forEach((i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i + 1);
      images[i] = img;
      img.onload = () => {
        if (cancelled) return;
        loaded++;
        const pct = Math.round((loaded / FRAME_COUNT) * 100);
        setLoadedPct(pct);
        if (i === 0) {
          setFirstFramePainted(true);
          requestAnimationFrame(() => draw(true));
        }
        if (loaded === FRAME_COUNT) onAllReady();
      };
      img.onerror = () => {
        if (cancelled) return;
        loaded++;
        setLoadedPct(Math.round((loaded / FRAME_COUNT) * 100));
        if (loaded === FRAME_COUNT) onAllReady();
      };
    });

    framesRef.current = images;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas sizing for crisp rendering on retina screens.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w: canvas.width, h: canvas.height };
      lastIdxRef.current = -1; // force redraw
      draw(true);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-frame draw loop, driven by scroll progress via the shared ref.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progressRef?.current ?? 0;
      // Clamp scroll progress to SCRUB_END so the final fraction
      // holds the interior frame instead of dragging us back to
      // the loop-back aerial that lives at the tail of the source.
      const vp = Math.min(1, p / SCRUB_END);
      const idx = Math.min(
        MAX_FRAME_INDEX,
        Math.max(0, Math.round(vp * MAX_FRAME_INDEX)),
      );
      if (idx !== lastIdxRef.current) draw(false, idx);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRef]);

  function draw(force, targetIdx) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    const idx = targetIdx ?? lastIdxRef.current;
    if (idx < 0) return;

    // Find nearest loaded frame so partial loads still draw something.
    let img = framesRef.current[idx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      let found = null;
      for (let off = 1; off < FRAME_COUNT; off++) {
        const a = framesRef.current[idx - off];
        if (a && a.complete && a.naturalWidth > 0) { found = a; break; }
        const b = framesRef.current[idx + off];
        if (b && b.complete && b.naturalWidth > 0) { found = b; break; }
      }
      if (!found) return;
      img = found;
    }

    if (!force && idx === lastIdxRef.current) return;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // object-cover math
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const ir = iw / ih;
    const cr = w / h;
    let dw, dh, dx, dy;
    if (ir > cr) {
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
      dy = 0;
    } else {
      dw = w;
      dh = w / ir;
      dx = 0;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    lastIdxRef.current = idx;
  }

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden="true"
      />
      {!firstFramePainted && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink">
          <span className="font-mono text-[10px] uppercase label-tracking text-paper/60">
            {loadedPct}%
          </span>
        </div>
      )}
    </div>
  );
}
