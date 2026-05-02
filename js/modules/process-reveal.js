function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

export function initProcessReveal() {
  const section = document.querySelector(".process");
  const track = section?.querySelector(".process-pin-track");
  const stage = section?.querySelector(".process-pin-stage");
  const timeline = section?.querySelector(".process-timeline");
  const steps = Array.from(section?.querySelectorAll(".process-step") ?? []);
  const numbers = Array.from(section?.querySelectorAll(".process-number") ?? []);
  const fill = section?.querySelector(".process-progress-fill");

  if (!section || !track || !stage || !timeline || !steps.length || !numbers.length || !fill) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stepThresholds = steps.map(() => ({ start: 0, end: 1 }));

  const updateRailMetrics = () => {
    const timelineRect = timeline.getBoundingClientRect();
    const firstMarkerRect = numbers[0].getBoundingClientRect();
    const lastMarkerRect = numbers[numbers.length - 1].getBoundingClientRect();
    const firstCenter = firstMarkerRect.top - timelineRect.top + firstMarkerRect.height / 2;
    const lastCenter = lastMarkerRect.top - timelineRect.top + lastMarkerRect.height / 2;
    const railHeight = Math.max(0, lastCenter - firstCenter);

    timeline.style.setProperty("--process-rail-top", `${firstCenter}px`);
    timeline.style.setProperty("--process-rail-height", `${railHeight}px`);
    section.style.setProperty(
      "--pin-length",
      `${Math.round(Math.max((window.innerHeight || 900) * 1.7, (window.innerHeight || 900) * 1.1 + steps.length * 80))}px`
    );

    const n = steps.length;
    stepThresholds = steps.map((_, index) => ({
      start: index / n,
      end: (index + 1) / n,
    }));
  };

  const computeTargetProgress = () => {
    const trackRect = track.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const scrollable = Math.max(track.offsetHeight - stage.offsetHeight, 1);

    return clamp((stickyTop - trackRect.top) / scrollable, 0, 1);
  };

  const render = (progress) => {
    let lineProgress = 0;
    let activeIndex = 0;

    steps.forEach((step, index) => {
      const { start, end } = stepThresholds[index] ?? { start: 0, end: 1 };
      const local = clamp((progress - start) / Math.max(end - start, 0.01), 0, 1);
      const eased = easeOutCubic(local);

      if (progress >= start) {
        activeIndex = index;
      }

      step.style.setProperty("--step-reveal", eased.toFixed(4));
      step.classList.toggle("is-visible", eased > 0.06);
    });

    const activeThreshold = stepThresholds[activeIndex] ?? { start: 0, end: 1 };
    const activeLocal = clamp((progress - activeThreshold.start) / Math.max(activeThreshold.end - activeThreshold.start, 0.01), 0, 1);
    const activeEase = easeOutCubic(activeLocal);

    lineProgress = (activeIndex + activeEase) / steps.length;

    timeline.style.setProperty("--process-progress", lineProgress.toFixed(4));
  };

  if (reduceMotion) {
    steps.forEach((step) => {
      step.classList.add("is-visible");
      step.style.setProperty("--step-reveal", "1");
    });
    timeline.style.setProperty("--process-progress", "1");
    return;
  }

  let target = 0;
  let current = 0;
  let running = false;

  const tick = () => {
    current += (target - current) * 0.14;

    if (Math.abs(target - current) < 0.0005) {
      current = target;
    }

    render(current);

    if (current === target) {
      running = false;
      return;
    }

    window.requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (running) {
      return;
    }

    running = true;
    window.requestAnimationFrame(tick);
  };

  const updateTarget = () => {
    target = computeTargetProgress();
    startLoop();
  };

  const onResize = () => {
    updateRailMetrics();
    updateTarget();
  };

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      updateRailMetrics();
      updateTarget();
    });

    resizeObserver.observe(section);
    resizeObserver.observe(timeline);
  }

  updateRailMetrics();
  target = computeTargetProgress();
  current = target;
  render(current);
}
