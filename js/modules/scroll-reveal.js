export function initSectionReveal() {
  const targets = Array.from(document.querySelectorAll(".reveal-on-scroll"));

  if (!targets.length) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    targets.forEach((target) => target.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -28% 0px",
    }
  );

  targets.forEach((target) => observer.observe(target));
}
