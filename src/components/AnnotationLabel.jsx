export default function AnnotationLabel({
  label,
  x,
  y,
  align = "right",
  length = 56,
  delay = 0,
}) {
  const isRight = align === "right";
  return (
    <div
      className="annotation absolute z-20 flex items-center gap-3 text-paper/85"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        flexDirection: isRight ? "row" : "row-reverse",
        opacity: 0,
        transform: "translate(-50%, -50%)",
      }}
      data-delay={delay}
    >
      <span className="block h-1.5 w-1.5 rounded-full border border-paper/80 bg-transparent" />
      <span
        className="block h-px bg-paper/55"
        style={{ width: `${length}px` }}
      />
      <span className="whitespace-nowrap font-mono text-[10px] uppercase label-tracking text-paper/85">
        {label}
      </span>
    </div>
  );
}
