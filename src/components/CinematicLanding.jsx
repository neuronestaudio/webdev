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

const SCENE_3 = {
  framesDir: "frames-scene3",
  frameCount: 240,
  maxFrameIndex: 239,
  scrubEnd: 0.95,
};

const SCENE_COUNT = 3;

const CHAPTER_LABELS = [
  "Site",
  "Approach",
  "Stillness",
  "Threshold",
  "Pavilion",
  "Mirror",
  "Sanctuary",
  "Daybeds",
  "Wholeness",
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
  {
    eyebrow: "VII  ·  Sanctuary",
    heading: "Reflected\npalms.",
    subheading:
      "The pool held quiet between concrete and canopy.",
  },
  {
    eyebrow: "VIII  ·  Daybeds",
    heading: "Two daybeds,\none canopy.",
    subheading:
      "An afternoon held still on the deck.",
  },
  {
    eyebrow: "IX  ·  Wholeness",
    heading: "Interior, water,\ngarden — one room.",
    subheading:
      "The villa opens fully; pool, lounge and living read as a single composition.",
  },
];

// Each scene occupies an equal slice of global scroll.
const SCENE_SLICE = 1 / SCENE_COUNT;
const BOUNDARY_1 = SCENE_SLICE;       // ≈ 0.333
const BOUNDARY_2 = SCENE_SLICE * 2;    // ≈ 0.667

// Two different crossfade styles:
// - boundary 1 (scene 1 → 2): a short dissolve. The shots are similar
//   but not identical compositions, so a brief crossfade reads as a
//   soft continuation.
// - boundary 2 (scene 2 → 3): a near-instant match cut. The last
//   frame of scene 2 and the first frame of scene 3 are essentially
//   the same composition — fading would just double-expose the
//   moving palms, so we swap fast.
const FADE_1_START = BOUNDARY_1 - 0.012;
const FADE_1_END = BOUNDARY_1 + 0.012;
const FADE_2_START = BOUNDARY_2 - 0.003;
const FADE_2_END = BOUNDARY_2 + 0.003;

// Chapter text timings, derived from a per-scene template applied to
// each scene's slice. Each scene's local progress:
//   ch1: in 0.02, out 0.27
//   ch2: in 0.31, out 0.58
//   ch3: in 0.62, out 0.88
const SCENE_CHAPTER_TEMPLATE = [
  { in: 0.02, out: 0.27 },
  { in: 0.31, out: 0.58 },
  { in: 0.62, out: 0.88 },
];

const CHAPTER_TIMINGS = [];
for (let s = 0; s < SCENE_COUNT; s++) {
  const base = s * SCENE_SLICE;
  for (const t of SCENE_CHAPTER_TEMPLATE) {
    CHAPTER_TIMINGS.push({
      in: base + t.in * SCENE_SLICE,
      out: base + t.out * SCENE_SLICE,
    });
  }
}

export default function CinematicLanding() {
  const containerRef = useRef(null);
  const scene1ProgRef = useRef(0);
  const scene2ProgRef = useRef(0);
  const scene3ProgRef = useRef(0);
  const globalProgRef = useRef(0);
  const scene2LayerRef = useRef(null);
  const scene3LayerRef = useRef(null);
  const scrollCueRef = useRef(null);
  const chapterRefs = useRef([]);

  // Stagger preloads so we don't hammer the network with 660+
  // simultaneous image requests on initial mount.
  const [scene1Ready, setScene1Ready] = useState(false);
  const [scene2Ready, setScene2Ready] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    chapterRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0, y: 12 });
    });
    if (scene2LayerRef.current) {
      gsap.set(scene2LayerRef.current, { opacity: 0 });
    }
    if (scene3LayerRef.current) {
      gsap.set(scene3LayerRef.current, { opacity: 0 });
    }

    const progressST = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        globalProgRef.current = p;

        // Per-scene scaled progress (0..1 within each third).
        scene1ProgRef.current = Math.min(1, p / SCENE_SLICE);
        scene2ProgRef.current = Math.max(
          0,
          Math.min(1, (p - SCENE_SLICE) / SCENE_SLICE),
        );
        scene3ProgRef.current = Math.max(
          0,
          (p - SCENE_SLICE * 2) / SCENE_SLICE,
        );

        // Boundary 1: short crossfade (scene 1 → 2).
        const op2 = Math.min(
          1,
          Math.max(0, (p - FADE_1_START) / (FADE_1_END - FADE_1_START)),
        );
        if (scene2LayerRef.current) {
          scene2LayerRef.current.style.opacity = op2;
        }

        // Boundary 2: near-instant match cut (scene 2 → 3).
        const op3 = Math.min(
          1,
          Math.max(0, (p - FADE_2_START) / (FADE_2_END - FADE_2_START)),
        );
        if (scene3LayerRef.current) {
          scene3LayerRef.current.style.opacity = op3;
        }

        // Hide the scroll cue once the user has clearly engaged.
        if (scrollCueRef.current) {
          scrollCueRef.current.style.opacity = p < 0.02 ? 1 : 0;
        }
      },
    });

    // Chapter text timeline.
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
      tl.to(el, { opacity: 1, y: 0, duration: 0.025 }, t.in);
      tl.to(el, { opacity: 0, y: -10, duration: 0.025 }, t.out);
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
      style={{ height: `${SCENE_COUNT * 360}vh` }}
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

        {/* Scene 2 overlay layer */}
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
            onReady={() => setScene2Ready(true)}
          />
        </div>

        {/* Scene 3 overlay layer */}
        <div
          ref={scene3LayerRef}
          className="absolute inset-0"
          style={{ opacity: 0 }}
        >
          <FrameSequence
            progressRef={scene3ProgRef}
            framesDir={SCENE_3.framesDir}
            frameCount={SCENE_3.frameCount}
            maxFrameIndex={SCENE_3.maxFrameIndex}
            scrubEnd={SCENE_3.scrubEnd}
            startLoading={scene2Ready}
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

        {/* Scroll cue */}
        <div
          ref={scrollCueRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase label-tracking text-paper/55 md:bottom-10"
          style={{ transition: "opacity 600ms ease-out" }}
        >
          <span>Scroll</span>
          <span className="block h-8 w-px bg-paper/35" />
        </div>

        {/* Chapter indicator — 9 dots covering all three scenes */}
        <ChapterIndicator
          progressRef={globalProgRef}
          chapters={CHAPTER_LABELS.map((label) => ({ label }))}
        />

        {/* Chapter texts */}
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
