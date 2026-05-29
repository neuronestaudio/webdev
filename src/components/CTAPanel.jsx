import { forwardRef } from "react";

/**
 * Final destination panel. Layered on top of the held last frame of
 * scene 4 (which is darkened by a separate overlay), so the
 * architectural backdrop is still faintly visible behind the
 * typography.
 */
const CTAPanel = forwardRef(function CTAPanel(_, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 z-20 flex items-center justify-center px-8 md:px-12"
      style={{ opacity: 0 }}
    >
      <div className="flex max-w-2xl flex-col items-center gap-10 text-center md:gap-12">
        <div className="flex flex-col items-center gap-3">
          <span className="block h-px w-10 bg-paper/55" />
          <span className="font-mono text-[10px] uppercase label-tracking text-paper/65">
            Private Reservations
          </span>
        </div>

        <h2 className="whitespace-pre-line font-serif text-5xl leading-[1.02] tracking-tight text-paper md:text-7xl lg:text-[5.5rem]">
          Begin your enquiry.
        </h2>

        <p className="max-w-md text-balance text-[15px] font-light leading-relaxed text-paper/75 md:text-base">
          Casa Calma hosts a single party at a time. Speak with our director to discuss dates,
          configurations and bespoke arrangements — complimentary, by private appointment.
        </p>

        <div className="flex flex-col items-center gap-5">
          <a
            href="mailto:stay@casacalma.example?subject=Casa%20Calma%20%E2%80%94%20Reservation%20Enquiry"
            className="group pointer-events-auto inline-flex items-center gap-5 border border-paper/70 px-10 py-5 font-mono text-[11px] uppercase label-tracking text-paper transition-colors duration-500 ease-out hover:bg-paper hover:text-ink"
          >
            <span>Book a Free Consultation</span>
            <span className="relative block h-px w-8 bg-current transition-all duration-500 ease-out group-hover:w-14">
              <span className="absolute -right-px -top-[3px] block h-[7px] w-[7px] -rotate-45 border-r border-t border-current" />
            </span>
          </a>

          <span className="font-mono text-[10px] uppercase label-tracking text-paper/45">
            Available today  ·  Reply within an hour
          </span>
        </div>

        <a
          href="mailto:stay@casacalma.example"
          className="pointer-events-auto font-mono text-[10px] uppercase label-tracking text-paper/55 transition-colors hover:text-paper"
        >
          stay@casacalma.example
        </a>
      </div>
    </div>
  );
});

export default CTAPanel;
