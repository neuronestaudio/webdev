import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Chapter from "./Chapter";
import ChapterIndicator from "./ChapterIndicator";
import FrameSequence from "./FrameSequence";

gsap.registerPlugin(ScrollTrigger);

const CHAPTER_1 = {
  eyebrow: "I  ·  Site",
  heading: "Between Sea\n& Cenote",
  subheading:
    "A private concrete refuge drawn between ocean, jungle and freshwater.",
};

const CHAPTER_2 = {
  eyebrow: "II  ·  Approach",
  heading: "A retreat cut\ninto the coastline.",
  subheading:
    "Architecture, landscape and water arranged as one calm axis.",
};

const CHAPTER_3 = {
  eyebrow: "III  ·  Stillness",
  heading: "Designed\nfor stillness.",
  subheading:
    "A quiet interior volume opening toward the tropical canopy.",
};

export default function CinematicLanding() {
  const containerRef = useRef(null);
  const chapter1Ref = useRef(null);
  const chapter2Ref = useRef(null);
  const chapter3Ref = useRef(null);
  const progressRef = useRef(0);
  const [, setReady] = useState(false);

  // Set up scroll-driven progress + chapter timeline. This runs on
  // mount because the frame sequence handles its own load lifecycle
  // and can start painting as soon as the first frame is in.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ch1 = chapter1Ref.current;
    const ch2 = chapter2Ref.current;
    const ch3 = chapter3Ref.current;

    gsap.set([ch1, ch2, ch3], { opacity: 0, y: 12 });

    // Progress driver — feeds the FrameSequence component.
    const progressST = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    // Chapter text crossfade timeline.
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
      },
    });

    tl.to(ch1, { opacity: 1, y: 0, duration: 0.07 }, 0.02);
    tl.to(ch1, { opacity: 0, y: -10, duration: 0.07 }, 0.27);

    tl.to(ch2, { opacity: 1, y: 0, duration: 0.07 }, 0.31);
    tl.to(ch2, { opacity: 0, y: -10, duration: 0.07 }, 0.58);

    tl.to(ch3, { opacity: 1, y: 0, duration: 0.08 }, 0.62);
    tl.to(ch3, { opacity: 0, y: -10, duration: 0.06 }, 0.88);

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
      style={{ height: "360vh" }}
    >
      {/* CSS sticky panel — no GSAP pin needed, which means no
          "pin release" jump at the end. The panel sits in view for
          the whole 360vh of scroll. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        <FrameSequence
          progressRef={progressRef}
          onReady={() => setReady(true)}
        />

        {/* Readability gradient — light top, heavier bottom where text sits */}
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
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase label-tracking text-paper/55 md:bottom-10">
          <span>Scroll</span>
          <span className="block h-8 w-px bg-paper/35" />
        </div>

        <ChapterIndicator progressRef={progressRef} />

        <Chapter ref={chapter1Ref} {...CHAPTER_1} />
        <Chapter ref={chapter2Ref} {...CHAPTER_2} />
        <Chapter ref={chapter3Ref} {...CHAPTER_3} />
      </div>
    </section>
  );
}
