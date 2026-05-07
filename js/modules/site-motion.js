export function initSiteMotion() {
  const html = document.documentElement;
  const body = document.body;
  const heroVideo = document.querySelector(".hero-video");

  body.classList.add("is-booting");
  html.style.scrollBehavior = "auto";

  const updateHeroParallax = () => {
    if (!heroVideo) {
      return;
    }

    heroVideo.style.setProperty("--hero-parallax", `${window.scrollY * 0.58}px`);
  };

  const scrollTo = (target, options = {}) => {
    if (!target) {
      return;
    }

    const element = target instanceof Element ? target : null;

    if (element) {
      element.scrollIntoView({
        behavior: options.behavior || "smooth",
        block: options.block || "start",
      });
    }
  };

  const boot = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        body.classList.add("is-loaded");
      });
    });
  };

  boot();

  updateHeroParallax();
  window.addEventListener("scroll", updateHeroParallax, { passive: true });

  document.addEventListener(
    "click",
    (event) => {
      const targetElement = event.target instanceof Element ? event.target : null;
      const anchor = targetElement?.closest("a[href^='#']");
      if (!anchor) {
        return;
      }

      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) {
        return;
      }

      event.preventDefault();
      scrollTo(target);
    },
    { passive: false }
  );

  return { scrollTo, lenis: null };
}
