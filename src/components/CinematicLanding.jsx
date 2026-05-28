import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Chapter from "./Chapter";
import ChapterIndicator from "./ChapterIndicator";
import FrameSequence from "./FrameSequence";

gsap.registerPlugin(ScrollTrigger);

// ---------- Scene configs ----------

const SCENE_1 = {
  framesDir: "frames",
  frameCount: 240,
  // Source video loops back to aerial at t=9.5s+. Stop on the interior
  // beat (frame index 228) and ignore the trailing loop-back frames.
  maxFrameIndex: 228,
  scrubEnd: 0.92,
};

const SCENE_2 = {
  framesDir: "frames-scene2",
  frameCount: 207,
  maxFrameIndex: 206,
  scrubEnd: 0.94,
};

// Total chapter count — used to size the indicator dots column.
const CHAPTER_LABELS = [
  "Site",
  "Approach",
  "Stillness",
  "Threshold",
  "Pavilion",
  "Mirror",
];

const CHAPTERS = [
  {
    eyebrow: "I  ·  Site",
    heading: "Between Sea\n& Cenote",
    subheading:
      "A private concrete refuge drawn between ocean, jungle and freshwater.",
  },
  {
    eyebrow: "II  ·  Approach",
    heading: "A retreat cut\ninto the coastline.",
    subheading:
      "Architecture, landscape and water arranged as one calm axis.",
  },
  {
    eyebrow: "III  ·  Stillness",
    heading: "Designed\nfor stillness.",
    subheading:
      "A quiet interior volume opening toward the tropical canopy.",
  },
  {
    eyebrow: "IV  ·  Threshold",
    heading: "Across the line\nbetween rooms.",
    subheading:
      "Glass dissolves; the interior breathes outward into the garden.",
  },
  {
    eyebrow: "V  ·  Pavilion",
    heading: "An open\npavilion.",
    subheading: "Stone, water and sky held under a single canopy.",
  },
  {
    eyebrow: "VI  ·  Mirror",
    heading: "A pool that\nholds the sky.",
    subheading: "Water stilled between palms and concrete.",
  },
];

// Scene 1 occupies first half of global scroll, scene 2 the second.
const SCENE_BOUNDARY = 0.5;
// Crossfade window (narrow — feels like a single dissolve).
const FADE_START = 0.485;
const FADE_END = 0.515;

// Chapter text fade timings (global progress). Each chapter holds for
// most of its allotted window, with fade-in slightly leading the
// previous chapter's fade-out for a clean handoff.
const CHAPTER_TIMINGS = [
  // Scene 1
  { in: 0.01, out: 0.135 },
  { in: 0.155, out: 0.29 },
  { in: 0.31, out: 0.44 },
  // Scene 2
  { in: 0.535, out: 0.65 },
  { in: 0.67, out: 0.79 },
  { in: 0.81, out: 0.94 },
];

export default function CinematicLanding() {
  const containerRef = useRef(null);
  const scene1ProgRef = useRef(0);
  const scene2ProgRef = useRef(0);
  const globalProgRef = useRef(0);
  const scene2LayerRef = useRef(null);
  const scrollCueRef = useRef(null);
  const chapterRefs = useRef([]);

  // Gate scene 2's preload so we don't fire ~450 image requests at
  // once on initial load.
  const [scene1Ready, setScene1Ready] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial states
    chapterRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0, y: 12 });
    });
    if (scene2LayerRef.current) {
      gsap.set(scene2LayerRef.current, { opacity: 0 });
    }

    // Driver: distributes global scroll progress to per-scene progress
    // and updates the scene 2 layer's opacity for the crossfade.
    const progressST = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        globalProgRef.current = p;

        // Per-scene scaled progress (0..1 within each half).
        scene1ProgRef.current = Math.min(1, p / SCENE_BOUNDARY);
        scene2ProgRef.current = Math.max(
          0,
          (p - SCENE_BOUNDARY) / (1 - SCENE_BOUNDARY),
        );

        // Crossfade scene 2 over scene 1 — sharp but eased.
        const op = Math.min(
          1,
          Math.max(0, (p - FADE_START) / (FADE_END - FADE_START)),
        );
        if (scene2LayerRef.current) {
          scene2LayerRef.current.style.opacity = op;
        }

        // Hide the scroll cue once the user has clearly engaged.
        if (scrollCueRef.current) {
          scrollCueRef.current.style.opacity = p < 0.03 ? 1 : 0;
        }
      },
    });

    // Chapter text timeline — single timeline covering all 6 chapters
    // relative to global scroll progress.
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
      },
    });

    CHAPTER_TIMINGS.forEach((t, i) => {
      const el = chapterRefs.current[i];
      if (!el) return;
      tl.to(el, { opacity: 1, y: 0, duration: 0.035 }, t.in);
      tl.to(el, { opacity: 0, y: -10, duration: 0.035 }, t.out);
    });

    tl.set({}, {}, 1);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      progressST.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-ink"
      style={{ height: "720vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        {/* Scene 1 base layer */}
        <div className="absolute inset-0">
          <FrameSequence
            progressRef={scene1ProgRef}
            framesDir={SCENE_1.framesDir}
            frameCount={SCENE_1.frameCount}
            maxFrameIndex={SCENE_1.maxFrameIndex}
            scrubEnd={SCENE_1.scrubEnd}
            startLoading={true}
            onReady={() => setScene1Ready(true)}
          />
        </div>

        {/* Scene 2 overlay layer — crossfades in around 50% progress */}
        <div
          ref={scene2LayerRef}
          className="absolute inset-0"
          style={{ opacity: 0 }}
        >
          <FrameSequence
            progressRef={scene2ProgRef}
            framesDir={SCENE_2.framesDir}
            frameCount={SCENE_2.frameCount}
            maxFrameIndex={SCENE_2.maxFrameIndex}
            scrubEnd={SCENE_2.scrubEnd}
            startLoading={scene1Ready}
          />
        </div>

        {/* Readability gradient */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,12,0.45) 0%, rgba(10,10,12,0) 18%, rgba(10,10,12,0) 50%, rgba(10,10,12,0.7) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,12,0.4) 0%, rgba(10,10,12,0) 40%)",
          }}
        />

        {/* Brand mark */}
        <div className="absolute left-8 top-8 z-30 flex items-center gap-3 md:left-12 md:top-10">
          <div className="h-6 w-6 border border-paper/55 p-[2px]">
            <div className="h-full w-full border border-paper/55" />
          </div>
          <span className="font-serif text-base text-paper">Casa Calma</span>
        </div>

        {/* Scroll cue (fades out after initial scroll) */}
        <div
          ref={scrollCueRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase label-tracking text-paper/55 md:bottom-10"
          style={{ transition: "opacity 600ms ease-out" }}
        >
          <span>Scroll</span>
          <span className="block h-8 w-px bg-paper/35" />
        </div>

        {/* Single chapter indicator — 6 dots covering both scenes */}
        <ChapterIndicator
          progressRef={globalProgRef}
          chapters={CHAPTER_LABELS.map((label) => ({ label }))}
        />

        {/* Chapter texts — all 6 mounted, timeline-driven opacity */}
        {CHAPTERS.map((c, i) => (
          <Chapter
            key={`${c.eyebrow}-${i}`}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            {...c}
          />
        ))}
      </div>
    </section>
  );
}
