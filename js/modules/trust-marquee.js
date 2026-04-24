import { TRUST_PROFILES } from "./trust-data.js";

const renderStat = ({ icon, value, label }) => `
  <span class="trust-stat">
    <img class="trust-icon" src="assets/icons/${icon}.svg" alt="" aria-hidden="true" />
    <span class="trust-stat-num">${value}</span>
    <span class="trust-stat-label">${label}</span>
  </span>
`;

const renderCard = ({ name, href, ariaLabel, avatar, stats }) => `
  <a class="trust-card trust-card--link" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${ariaLabel}">
    <div class="trust-avatar" aria-hidden="true">
      <img src="${avatar}" alt="" aria-hidden="true" />
    </div>
    <div class="trust-card-body">
      <p class="trust-name">${name}</p>
      <div class="trust-stats">
        ${stats.map(renderStat).join("")}
      </div>
    </div>
  </a>
`;

function getTrackMarkup() {
  return TRUST_PROFILES.map(renderCard).join("");
}

function ensureTracks(clientsStrip) {
  const tracks = clientsStrip.querySelectorAll(".clients-track");

  if (tracks.length >= 2) {
    tracks[0].innerHTML = getTrackMarkup();
    tracks[1].innerHTML = getTrackMarkup();
    tracks[1].setAttribute("aria-hidden", "true");
    return;
  }

  clientsStrip.innerHTML = `
    <div class="clients-track">${getTrackMarkup()}</div>
    <div class="clients-track" aria-hidden="true">${getTrackMarkup()}</div>
  `;
}

function initTrustCarousel() {
  const clientsStrip = document.querySelector(".clients-strip");
  const clientsPrev = document.querySelector(".clients-nav--prev");
  const clientsNext = document.querySelector(".clients-nav--next");

  if (!clientsStrip || !clientsPrev || !clientsNext) {
    return;
  }

  ensureTracks(clientsStrip);

  const getCardStep = () => {
    const card = clientsStrip.querySelector(".trust-card");
    const nextCard = card?.nextElementSibling?.classList?.contains("trust-card") ? card.nextElementSibling : null;

    if (!card || !nextCard) {
      return Math.max(280, clientsStrip.clientWidth * 0.72);
    }

    return nextCard.getBoundingClientRect().left - card.getBoundingClientRect().left;
  };

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const animateScrollBy = (distance) => {
    const duration = 620;
    const start = clientsStrip.scrollLeft;
    const target = start + distance;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      clientsStrip.scrollLeft = start + (target - start) * easeInOutCubic(progress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const autoSpeed = 42;
  let lastTime = performance.now();

  clientsStrip.style.scrollBehavior = "auto";

  const loopScroll = (now) => {
    const halfWidth = clientsStrip.scrollWidth / 2;
    const delta = Math.max(0, now - lastTime);
    lastTime = now;

    if (halfWidth > 0) {
      const nextScroll = clientsStrip.scrollLeft + (autoSpeed * delta) / 1000;
      clientsStrip.scrollLeft = nextScroll >= halfWidth ? nextScroll - halfWidth : nextScroll;
    }

    window.requestAnimationFrame(loopScroll);
  };

  clientsPrev.addEventListener("click", () => {
    animateScrollBy(-getCardStep());
  });

  clientsNext.addEventListener("click", () => {
    animateScrollBy(getCardStep());
  });

  window.requestAnimationFrame(loopScroll);
}

export { initTrustCarousel };
