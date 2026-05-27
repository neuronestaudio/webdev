import { forwardRef } from "react";

const Chapter = forwardRef(function Chapter(
  { eyebrow, heading, subheading },
  ref,
) {
  return (
    <div
      ref={ref}
      className="chapter pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-8 pb-24 md:px-16 md:pb-28 lg:px-24 lg:pb-32"
      style={{ opacity: 0, willChange: "opacity, transform" }}
    >
      <div className="flex max-w-2xl flex-col gap-5">
        <span className="font-mono text-[10px] uppercase label-tracking text-paper/60">
          {eyebrow}
        </span>
        <h2 className="whitespace-pre-line font-serif text-4xl leading-[1.02] tracking-tight text-paper md:text-6xl lg:text-[5rem]">
          {heading}
        </h2>
        <p className="max-w-md text-balance text-sm font-light leading-relaxed text-paper/75 md:text-base">
          {subheading}
        </p>
      </div>
    </div>
  );
});

export default Chapter;
