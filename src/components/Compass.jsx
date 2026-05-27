import { useEffect, useRef } from "react";

export default function Compass({ progressRef }) {
  const ringRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const p = progressRef?.current ?? 0;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${p * 90}deg)`;
      }
      if (tickerRef.current) {
        const deg = Math.round(p * 90);
        tickerRef.current.textContent = `${deg.toString().padStart(2, "0")}°`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <div className="pointer-events-none absolute right-6 top-6 z-30 flex items-center gap-3 md:right-10 md:top-10">
      <div className="hidden flex-col items-end text-[10px] uppercase label-tracking text-paper/70 md:flex">
        <span>20.3892° N</span>
        <span>87.3018° W</span>
      </div>
      <div className="relative h-16 w-16 md:h-20 md:w-20">
        <div
          ref={ringRef}
          className="absolute inset-0 rounded-full border border-paper/30"
          style={{ transition: "transform 80ms linear" }}
        >
          <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[9px] uppercase label-tracking text-paper/80">
            N
          </span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] uppercase label-tracking text-paper/40">
            S
          </span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] uppercase label-tracking text-paper/40">
            W
          </span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] uppercase label-tracking text-paper/40">
            E
          </span>
        </div>
        <div className="absolute inset-3 rounded-full border border-paper/15" />
        <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-paper/30" />
        <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-paper/30" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
        <div
          ref={tickerRef}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase label-tracking text-paper/60"
        >
          00°
        </div>
      </div>
    </div>
  );
}
