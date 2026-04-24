import { CLIENT_WORDS } from "./client-words-data.js?v=3";

const renderStat = ({ icon, value, label }) => `
  <span class="client-card-stat">
    <img class="client-card-icon" src="assets/icons/${icon}.svg" alt="" aria-hidden="true" />
    <span class="client-card-stat-value">${value}</span>
    <span class="client-card-stat-label">${label}</span>
  </span>
`;

function renderPanel(profile, index) {
  return `
    <article class="client-panel" data-client-panel data-index="${index}" aria-label="Testimonial from ${profile.name}">
      <blockquote class="client-quote">
        <p class="client-quote-text">${profile.text}</p>
      </blockquote>

      <a class="client-card client-card--link" href="${profile.href}" target="_blank" rel="noopener noreferrer" aria-label="${profile.ariaLabel}">
        <div class="client-card-avatar" aria-hidden="true">
          <img src="${profile.avatar}" alt="" aria-hidden="true" />
        </div>
        <div class="client-card-body">
          <p class="client-card-name">${profile.name}</p>
          <div class="client-card-stats">
            ${profile.stats.map(renderStat).join("")}
          </div>
        </div>
      </a>
    </article>
  `;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

export function initClientWordsReveal() {
  const section = document.querySelector(".client-words");
  const track = section?.querySelector(".client-words-pin-track");
  const stage = section?.querySelector(".client-words-pin-stage");
  const rail = section?.querySelector("[data-client-rail]");

  if (!section || !track || !stage || !rail || !CLIENT_WORDS.length) {
    return;
  }

  rail.innerHTML = CLIENT_WORDS.map(renderPanel).join("");
  const panels = Array.from(rail.querySelectorAll(".client-panel"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updatePinLength = () => {
    const viewportHeight = window.innerHeight || 900;
    const isCompactViewport = window.matchMedia("(max-width: 700px)").matches;
    const baseMultiplier = isCompactViewport ? 1.72 : 2.08;
    const contentLength = viewportHeight * (isCompactViewport ? 0.62 : 0.76) + CLIENT_WORDS.length * (isCompactViewport ? 76 : 98);
    const extraScroll = Math.max(viewportHeight * baseMultiplier, contentLength);
    section.style.setProperty("--client-words-length", `${Math.round(extraScroll)}px`);
  };

  const getProgress = () => {
    const trackRect = track.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const scrollable = Math.max(track.offsetHeight - stage.offsetHeight, 1);
    return clamp((stickyTop - trackRect.top) / scrollable, 0, 1);
  };

  let targetIndex = 0;
  let currentIndex = 0;
  let activeIndex = 0;
  let running = false;
  let settleUntil = 0;
  let lastProgress = 0;
  const settleDuration = 260;
  const thresholdBuffer = 0.085;
  const finalStepLead = 0.28;

  const render = () => {
    panels.forEach((panel, index) => {
      const distance = index - currentIndex;
      const absDistance = Math.min(1, Math.abs(distance));
      const reveal = easeOutCubic(clamp(1 - absDistance, 0, 1));

      panel.style.setProperty("--panel-offset-y", `${distance * 152}px`);
      panel.style.setProperty("--panel-opacity", reveal.toFixed(4));
      panel.style.setProperty("--panel-scale", `${1 - absDistance * 0.03}`);
      panel.style.setProperty("--panel-blur", `${absDistance * 12}px`);
      panel.style.zIndex = String(Math.round((1 - absDistance) * 100));
      panel.classList.toggle("is-active", absDistance < 0.06);
    });
  };

  const tick = () => {
    currentIndex += (targetIndex - currentIndex) * 0.12;

    if (Math.abs(targetIndex - currentIndex) < 0.01) {
      currentIndex = targetIndex;
    }

    if (currentIndex === targetIndex) {
      activeIndex = targetIndex;
      settleUntil = performance.now() + settleDuration;
    }

    render();

    if (currentIndex === targetIndex) {
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
    const progress = getProgress();
    const now = performance.now();

    if (now < settleUntil) {
      lastProgress = progress;
      return;
    }

    const direction = progress >= lastProgress ? 1 : -1;
    lastProgress = progress;

    if (direction > 0) {
      const nextIndex = Math.min(activeIndex + 1, CLIENT_WORDS.length - 1);
      const nextThreshold = CLIENT_WORDS.length <= 1
        ? 1
        : nextIndex === CLIENT_WORDS.length - 1
          ? clamp(1 - finalStepLead, 0, 1)
          : clamp((nextIndex / (CLIENT_WORDS.length - 1)) + thresholdBuffer, 0, 0.92);

      targetIndex = progress >= nextThreshold ? nextIndex : activeIndex;
    } else if (direction < 0) {
      const prevIndex = Math.max(activeIndex - 1, 0);
      const prevThreshold = CLIENT_WORDS.length <= 1
        ? 0
        : prevIndex === 0
          ? 0
          : clamp((prevIndex / (CLIENT_WORDS.length - 1)) - thresholdBuffer, 0, 0.88);

      targetIndex = progress <= prevThreshold ? prevIndex : activeIndex;
    } else {
      targetIndex = activeIndex;
    }

    startLoop();
  };

  if (reduceMotion) {
    section.classList.add("is-revealed");
    panels.forEach((panel) => {
      panel.classList.add("is-active");
      panel.style.setProperty("--panel-offset-y", "0px");
      panel.style.setProperty("--panel-opacity", "1");
      panel.style.setProperty("--panel-scale", "1");
      panel.style.setProperty("--panel-blur", "0px");
    });
    section.style.setProperty("--client-words-length", "auto");
    return;
  }

  const onResize = () => {
    updatePinLength();
    updateTarget();
  };

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      updatePinLength();
      updateTarget();
    });

    observer.observe(section);
    observer.observe(track);
    observer.observe(stage);
  }

  updatePinLength();
  currentIndex = 0;
  activeIndex = 0;
  targetIndex = 0;
  lastProgress = 0;
  render();
  updateTarget();
}
