import { useEffect, useRef, useState } from "react";

// Watches a single element with IntersectionObserver and sets isVisible=true
// once it enters the viewport. Fires once (unobserves on first intersection),
// so content doesn't jitter in and out when the user scrolls back up.
//
// Pair with the .reveal utility in index.css:
//   const { ref, visible } = useReveal();
//   <div ref={ref} className={`reveal ${visible ? "in-view" : ""}`}>...</div>
export function useReveal({ threshold = 0.15, rootMargin = "0px 0px -8% 0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Older browsers / SSR safety: show immediately if IO isn't available.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

// Small wrapper for the common case: one element, one reveal, optional delay.
import { createElement } from "react";
export function Reveal({ as = "div", delay = 0, className = "", children, ...rest }) {
  const { ref, visible } = useReveal();
  const delayClass = delay ? `reveal-delay-${delay}` : "";
  return createElement(
    as,
    { ref, className: `reveal ${delayClass} ${visible ? "in-view" : ""} ${className}`.trim(), ...rest },
    children
  );
}
