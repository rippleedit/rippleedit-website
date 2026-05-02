export function initSiteMotion() {
  const html = document.documentElement;
  const body = document.body;
  const heroVideo = document.querySelector(".hero-video");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  body.classList.add("is-booting");
  html.style.scrollBehavior = "auto";

  let rafId = null;
  let currentScroll = window.scrollY;
  let targetScroll = window.scrollY;
  let touchStartY = null;

  const updateHeroParallax = () => {
    if (!heroVideo) {
      return;
    }

    heroVideo.style.setProperty("--hero-parallax", `${window.scrollY * 0.58}px`);
  };

  const clampScroll = (value) => {
    const scrollElement = document.scrollingElement || document.documentElement;
    const maxScroll = Math.max(0, scrollElement.scrollHeight - window.innerHeight);
    return Math.min(maxScroll, Math.max(0, value));
  };

  const queueScroll = (value) => {
    targetScroll = clampScroll(value);

    if (rafId) {
      return;
    }

    const tick = () => {
      currentScroll += (targetScroll - currentScroll) * 0.24;

      if (Math.abs(targetScroll - currentScroll) < 0.5) {
        currentScroll = targetScroll;
      }

      window.scrollTo(0, currentScroll);
      updateHeroParallax();

      if (currentScroll === targetScroll) {
        rafId = null;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
  };

  const scrollTo = (target, options = {}) => {
    if (!target) {
      return;
    }

    const element = target instanceof Element ? target : null;

    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY;
      queueScroll(top);
      return;
    }

    if (typeof target === "number") {
      queueScroll(target);
      return;
    }

    if (typeof target === "object" && typeof target.top === "number") {
      queueScroll(target.top);
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

  if (prefersReducedMotion) {
    html.style.scrollBehavior = "auto";
    body.classList.add("is-loaded");
    updateHeroParallax();
    return { scrollTo, lenis: null };
  }

  updateHeroParallax();

  const isScrollableInput = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    return Boolean(element.closest("input, textarea, select, option, [contenteditable='true']"));
  };

  const shouldBypassWheel = (event) => {
    const target = event.target instanceof Element ? event.target : null;

    if (isScrollableInput(target)) {
      return true;
    }

    const horizontalStrip = target?.closest(".work-strip, .clients-strip");
    return Boolean(horizontalStrip && Math.abs(event.deltaX) > Math.abs(event.deltaY));
  };

  const normalizeWheelDelta = (event) => {
    let delta = event.deltaY;

    if (event.deltaMode === 1) {
      delta *= 16;
    } else if (event.deltaMode === 2) {
      delta *= window.innerHeight;
    }

    return delta;
  };

  const syncScrollFromNative = () => {
    if (rafId === null) {
      currentScroll = window.scrollY;
      targetScroll = window.scrollY;
    }
  };

  const handleWheel = (event) => {
    if (shouldBypassWheel(event)) {
      return;
    }

    event.preventDefault();
    syncScrollFromNative();
    const delta = normalizeWheelDelta(event);
    queueScroll(window.scrollY + delta * 1.55);
  };

  const handleTouchStart = (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (touchStartY === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - currentY;
    touchStartY = currentY;
    event.preventDefault();
    queueScroll(window.scrollY + delta * 1.35);
  };

  const handleKeyDown = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (isScrollableInput(event.target)) {
      return;
    }

    const step = Math.max(180, window.innerHeight * 0.22);

    switch (event.key) {
      case "ArrowDown":
      case "PageDown":
      case " ":
        event.preventDefault();
        queueScroll(window.scrollY + step);
        break;
      case "ArrowUp":
      case "PageUp":
        event.preventDefault();
        queueScroll(window.scrollY - step);
        break;
      case "Home":
        event.preventDefault();
        queueScroll(0);
        break;
      case "End":
        event.preventDefault();
        queueScroll((document.scrollingElement || document.documentElement).scrollHeight);
        break;
      default:
        break;
    }
  };

  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("keydown", handleKeyDown);
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
