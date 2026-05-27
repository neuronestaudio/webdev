import { useEffect } from "react";

import CinematicLanding from "./components/CinematicLanding";
import { initSmoothScroll, destroySmoothScroll } from "./lib/smoothScroll";

export default function App() {
  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);

  return (
    <main className="relative w-full bg-ink text-paper">
      <CinematicLanding />
    </main>
  );
}
