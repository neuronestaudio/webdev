import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: 1, label: "Site" },
  { id: 2, label: "Approach" },
  { id: 3, label: "Stillness" },
];

export default function ChapterIndicator({ progressRef }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const p = progressRef?.current ?? 0;
      const idx = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      setActive((curr) => (curr === idx ? curr : idx));
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <div className="pointer-events-none absolute right-8 top-1/2 z-30 -translate-y-1/2 md:right-12">
      <ul className="flex flex-col items-end gap-4">
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3">
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
