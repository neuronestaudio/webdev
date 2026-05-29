import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Chapter from "./Chapter";
import ChapterIndicator from "./ChapterIndicator";
import FrameSequence from "./FrameSequence";

gsap.registerPlugin(ScrollTrigger);

// ---------- Scene configs ----------

const SCENES = [
  {
    framesDir: "frames",
    frameCount: 240,
    // Source loops back to aerial at t=9.5s+ — stop on the interior beat.
    maxFrameIndex: 228,
    scrubEnd: 0.92,
  },
  {
    framesDir: "frames-scene2",
    frameCount: 207,
    maxFrameIndex: 206,
    scrubEnd: 0.94,
  },
  {
    framesDir: "frames-scene3",
    // First second of source was AI regeneration overlap — dropped at
    // extract time so the match cut picks up forward of scene 2's end.
    frameCount: 216,
    maxFrameIndex: 215,
    scrubEnd: 0.95,
  },
  {
    framesDir: "frames-scene4",
    // Scene 4 has a built-in cross-dissolve over its first ~24 frames
    // (pool → kitchen). We keep those frames and use them as the
    // mask transition itself, layered with our own crossfade.
    frameCount: 127,
    maxFrameIndex: 126,
    scrubEnd: 0.94,
  },
];

const SCENE_COUNT = SCENES.length;
const SCENE_SLICE = 1 / SCENE_COUNT;

// One transition entry per boundary between scenes.
//   width — fraction of global scroll progress over which the cross
//           runs. Tight (≈0.006) reads as an instant cut; wide
//           (≈0.04) reads as a deliberate dissolve.
//   blur  — peak blur (px) applied to both scenes during the cross.
//           Hides micro-jumps and creates a soft "morph" feel. 0 means
//           no filter is applied (cheaper, and visually right when the
//           shots are clearly different).
const TRANSITIONS = [
  // Scene 1 → 2: similar interior+jungle compositions but different
  // shots. Short crossfade reads as a soft continuation.
  { width: 0.024, blur: 0 },
  // Scene 2 → 3: same pool composition with the camera continuing.
  // Tight cross + a brief blur peak masks any AI palm-position jitter.
  { width: 0.020, blur: 3 },
  // Scene 3 → 4: deliberate mask dissolve from pool to kitchen. Wider
  // cross meshes with scene 4's own built-in pool→kitchen fade-in.
  { width: 0.044, blur: 1.5 },
];

const CHAPTER_LABELS = [
  "Site", "Approach", "Stillness",
  "Threshold", "Pavilion", "Mirror",
  "Sanctuary", "Daybeds", "Wholeness",
  "Kitchen", "Materials", "Ritual",
];

const CHAPTERS = [
  { eyebrow: "I  ·  Site",       heading: "Between Sea\n& Cenote",                subheading: "A private concrete refuge drawn between ocean, jungle and freshwater." },
  { eyebrow: "II  ·  Approach",  heading: "A retreat cut\ninto the coastline.",   subheading: "Architecture, landscape and water arranged as one calm axis." },
  { eyebrow: "III  ·  Stillness",heading: "Designed\nfor stillness.",             subheading: "A quiet interior volume opening toward the tropical canopy." },
  { eyebrow: "IV  ·  Threshold", heading: "Across the line\nbetween rooms.",      subheading: "Glass dissolves; the interior breathes outward into the garden." },
  { eyebrow: "V  ·  Pavilion",   heading: "An open\npavilion.",                   subheading: "Stone, water and sky held under a single canopy." },
  { eyebrow: "VI  ·  Mirror",    heading: "A pool that\nholds the sky.",          subheading: "Water stilled between palms and concrete." },
  { eyebrow: "VII  ·  Sanctuary",heading: "Reflected\npalms.",                    subheading: "The pool held quiet between concrete and canopy." },
  { eyebrow: "VIII · Daybeds",   heading: "Two daybeds,\none canopy.",            subheading: "An afternoon held still on the deck." },
  { eyebrow: "IX  ·  Wholeness", heading: "Interior, water,\ngarden — one room.", subheading: "The villa opens fully; pool, lounge and living read as a single composition." },
  { eyebrow: "X  ·  Kitchen",    heading: "The heart\nof the house.",             subheading: "Stone, wood and morning light." },
  { eyebrow: "XI  ·  Materials", heading: "Travertine,\nwalnut, marble.",         subheading: "The palette continues through every surface." },
  { eyebrow: "XII ·  Ritual",    heading: "A quiet stage\nfor the day.",          subheading: "Where every morning begins." },
];

// Per-scene chapter timings (in/out as fraction of scene-local progress).
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

// ---------- Helpers ----------

// For a given scene index, compute the opacity it should have at
// global progress p, plus any blur it inherits from being on either
// side of an active transition.
function computeSceneOpacity(i, p) {
  if (i === 0) return 1;
  const t = TRANSITIONS[i - 1];
  const boundary = i * SCENE_SLICE;
  const start = boundary - t.width / 2;
  const end = boundary + t.width / 2;
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / (end - start);
}

function computeSceneBlur(i, p) {
  let blur = 0;
  // As outgoing layer of transition i
  if (i < SCENE_COUNT - 1) {
    const t = TRANSITIONS[i];
    const boundary = (i + 1) * SCENE_SLICE;
    const half = t.width / 2;
    if (t.blur > 0 && p >= boundary - half && p <= boundary + half) {
      const dist = Math.abs(p - boundary);
      blur = Math.max(blur, t.blur * (1 - dist / half));
    }
  }
  // As incoming layer of transition i-1
  if (i > 0) {
    const t = TRANSITIONS[i - 1];
    const boundary = i * SCENE_SLICE;
    const half = t.width / 2;
    if (t.blur > 0 && p >= boundary - half && p <= boundary + half) {
      const dist = Math.abs(p - boundary);
      blur = Math.max(blur, t.blur * (1 - dist / half));
    }
  }
  return blur;
}

// ---------- Component ----------

export default function CinematicLanding() {
  const containerRef = useRef(null);
  const globalProgRef = useRef(0);
  const sceneProgRefs = useRef(SCENES.map(() => ({ current: 0 })));
  const sceneLayerRefs = useRef(SCENES.map(() => ({ current: null })));
  const scrollCueRef = useRef(null);
  const chapterRefs = useRef([]);

  // Stagger preloads so we don't slam the network with ~700 image
  // requests at mount.
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    chapterRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0, y: 12 });
    });

    // Initial layer opacities: only scene 0 is visible.
    sceneLayerRefs.current.forEach((ref, i) => {
      if (ref.current) {
        ref.current.style.opacity = i === 0 ? "1" : "0";
        ref.current.style.filter = "";
      }
    });

    const progressST = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        globalProgRef.current = p;

        // Per-scene local progress (0..1 within each slice).
        for (let i = 0; i < SCENE_COUNT; i++) {
          sceneProgRefs.current[i].current = Math.max(
            0,
            Math.min(1, (p - i * SCENE_SLICE) / SCENE_SLICE),
          );
        }

        // Per-scene opacity + blur.
        for (let i = 0; i < SCENE_COUNT; i++) {
          const layer = sceneLayerRefs.current[i].current;
          if (!layer) continue;
          const op = computeSceneOpacity(i, p);
          const blur = computeSceneBlur(i, p);
          layer.style.opacity = op;
          layer.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
        }

        // Hide scroll cue once user engages.
        if (scrollCueRef.current) {
          scrollCueRef.current.style.opacity = p < 0.02 ? 1 : 0;
        }
      },
    });

    // Chapter text fade timeline.
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
        {/* Scene layers */}
        {SCENES.map((scene, i) => (
          <div
            key={scene.framesDir}
            ref={(el) => {
              sceneLayerRefs.current[i].current = el;
            }}
            className="absolute inset-0 will-change-[opacity,filter]"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <FrameSequence
              progressRef={sceneProgRefs.current[i]}
              framesDir={scene.framesDir}
              frameCount={scene.frameCount}
              maxFrameIndex={scene.maxFrameIndex}
              scrubEnd={scene.scrubEnd}
              startLoading={i === 0 || readyCount >= i}
              onReady={() => setReadyCount((c) => Math.max(c, i + 1))}
            />
          </div>
        ))}

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

        {/* Chapter indicator */}
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
