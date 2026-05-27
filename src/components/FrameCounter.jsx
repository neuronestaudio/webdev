import { useEffect, useRef } from "react";

const TOTAL_FRAMES = 240;

export default function FrameCounter({ progressRef }) {
  const elRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progressRef?.current ?? 0;
      const f = Math.round(p * TOTAL_FRAMES);
      if (elRef.current) {
        elRef.current.textContent = `FRAME / ${String(f).padStart(3, "0")} — ${TOTAL_FRAMES}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return <span ref={elRef}>FRAME / 000 — {TOTAL_FRAMES}</span>;
}
