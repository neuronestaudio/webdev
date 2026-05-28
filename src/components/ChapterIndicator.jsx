import { useEffect, useState } from "react";

/**
 * Right-side stack of chapter dots that highlights the active chapter
 * based on a 0..1 progress ref.
 *
 * Props:
 *  - progressRef    ref whose .current is 0..1
 *  - chapters       array of { label } objects (one per chapter)
 */
export default function ChapterIndicator({ progressRef, chapters }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const step = 1 / chapters.length;
    const update = () => {
      const p = progressRef?.current ?? 0;
      const idx = Math.min(chapters.length - 1, Math.floor(p / step));
      setActive((curr) => (curr === idx ? curr : idx));
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, chapters.length]);

  return (
    <div className="pointer-events-none absolute right-8 top-1/2 z-30 -translate-y-1/2 md:right-12">
      <ul className="flex flex-col items-end gap-4">
        {chapters.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-3">
            <span
              className={`font-mono text-[10px] uppercase label-tracking transition-opacity duration-700 ${
                active === i ? "opacity-90" : "opacity-0"
              }`}
            >
              {c.label}
            </span>
            <span
              className={`block h-px transition-all duration-700 ${
                active === i ? "w-6 bg-paper/90" : "w-3 bg-paper/40"
              }`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
