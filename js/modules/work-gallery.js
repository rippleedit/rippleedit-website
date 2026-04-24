import { LONG_FORM, SHORT_FORM } from "./work-data.js";

const collections = {
  long: LONG_FORM,
  short: SHORT_FORM,
};

let initialized = false;
let isOpen = false;
let activeCollection = "long";
let activeIndex = 0;
let previousBodyOverflow = "";
let lightbox = null;
let lightboxStage = null;
let reducedMotion = false;
let mediaActivated = false;
let mediaObserver = null;

function buildEmbedUrl(ytId, autoplay = true) {
  const params = autoplay
    ? "autoplay=1&mute=1&loop=1&playlist="
    : "loop=1&playlist=";

  return `https://www.youtube.com/embed/${ytId}?${params}${ytId}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;
}

function buildCard(item, collection, index) {
  const hasPreview = Boolean(item.preview);
  const mediaMarkup = hasPreview
    ? `
      <video class="work-card-video" muted loop playsinline preload="none" poster="${item.poster ?? ""}">
        <source src="${item.preview}" type="video/mp4" />
      </video>
    `
    : `
      <iframe
        class="work-card-embed"
        data-embed-src="${buildEmbedUrl(item.ytId, true)}"
        src="about:blank"
        title="${item.title}"
        frameborder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        aria-hidden="true"
        tabindex="-1"
      ></iframe>
    `;

  return `
    <article class="work-card" data-yt-id="${item.ytId}" data-collection="${collection}" data-index="${index}" data-is-short="${item.isShort ? "true" : "false"}" tabindex="0" role="button" aria-label="Play ${item.title}">
      <div class="work-card-media ${hasPreview ? "" : "work-card-media--embed"}">
        ${mediaMarkup}
      </div>
      <p class="work-card-title">${item.title}</p>
    </article>
  `;
}

function setLightboxStage(collection, index) {
  const entry = collections[collection][index];
  if (!entry || !lightboxStage || !lightbox) {
    return;
  }

  lightboxStage.innerHTML = `
    <iframe class="work-lightbox-iframe" src="https://www.youtube.com/embed/${entry.ytId}?autoplay=1&rel=0&modestbranding=1" title="${entry.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  `;

  lightbox.classList.toggle("work-lightbox--short", Boolean(entry.isShort));
}

function openLightbox(collection, index) {
  if (!lightbox || !lightboxStage) {
    return;
  }

  activeCollection = collection;
  activeIndex = index;
  isOpen = true;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.classList.add("lightbox-open");
  lightbox.hidden = false;
  pauseAllPreviews();
  setLightboxStage(collection, index);
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  closeButton?.focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightbox || !lightboxStage) {
    return;
  }

  isOpen = false;
  document.body.style.overflow = previousBodyOverflow;
  document.body.classList.remove("lightbox-open");
  pauseAllPreviews();
  lightboxStage.innerHTML = "";
  lightbox.hidden = true;
  lightbox.classList.remove("work-lightbox--short");
}

function next() {
  const items = collections[activeCollection];
  activeIndex = (activeIndex + 1) % items.length;
  setLightboxStage(activeCollection, activeIndex);
}

function prev() {
  const items = collections[activeCollection];
  activeIndex = (activeIndex - 1 + items.length) % items.length;
  setLightboxStage(activeCollection, activeIndex);
}

function playPreview(video) {
  if (reducedMotion || !mediaActivated || !video) {
    return;
  }

  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function pausePreview(video) {
  if (!video) {
    return;
  }

  video.pause();
  video.currentTime = 0;
}

function pauseAllPreviews() {
  document.querySelectorAll(".work-card-video").forEach((video) => {
    pausePreview(video);
  });
}

function attachCardHandlers(card) {
  const video = card.querySelector("video");

  card.addEventListener("mouseenter", () => playPreview(video));
  card.addEventListener("focus", () => playPreview(video));
  card.addEventListener("mouseleave", () => pausePreview(video));
  card.addEventListener("blur", () => pausePreview(video));

  card.addEventListener("click", () => {
    openLightbox(card.dataset.collection, Number(card.dataset.index));
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(card.dataset.collection, Number(card.dataset.index));
    }
  });
}

function attachCarouselNavs(carousel) {
  const strip = carousel.querySelector(".work-strip");
  const prevButton = carousel.querySelector(".work-nav--prev");
  const nextButton = carousel.querySelector(".work-nav--next");
  const behavior = reducedMotion ? "auto" : "smooth";

  prevButton?.addEventListener("click", () => {
    strip?.scrollBy({ left: -strip.clientWidth * 0.75, behavior });
  });

  nextButton?.addEventListener("click", () => {
    strip?.scrollBy({ left: strip.clientWidth * 0.75, behavior });
  });
}

function setupLightbox() {
  lightbox = document.querySelector("[data-work-lightbox]");
  lightboxStage = document.querySelector("[data-lightbox-stage]");

  if (!lightbox || !lightboxStage) {
    return;
  }

  lightbox.addEventListener("click", (event) => {
    const target = event.target;
    if (target.closest("[data-lightbox-close]")) {
      closeLightbox();
    }
  });

  lightbox.querySelector("[data-lightbox-prev]")?.addEventListener("click", prev);
  lightbox.querySelector("[data-lightbox-next]")?.addEventListener("click", next);

  document.addEventListener("keydown", (event) => {
    if (!isOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  });
}

function activateCardMedia(card) {
  const video = card.querySelector("video");
  const embed = card.querySelector(".work-card-embed");

  if (video) {
    playPreview(video);
  }

  if (embed && embed.dataset.embedSrc && embed.getAttribute("src") !== embed.dataset.embedSrc) {
    embed.setAttribute("src", reducedMotion ? buildEmbedUrl(card.dataset.ytId ?? "", false) : embed.dataset.embedSrc);
  }
}

function activateWorkMedia() {
  if (mediaActivated) {
    return;
  }

  mediaActivated = true;
  document.querySelectorAll(".work-card").forEach((card) => activateCardMedia(card));
}

function setupMediaActivation(strip) {
  const portfolioSection = strip.closest(".portfolio");

  if (!portfolioSection) {
    activateWorkMedia();
    return;
  }

  if (portfolioSection.classList.contains("is-revealed")) {
    activateWorkMedia();
    return;
  }

  mediaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        activateWorkMedia();
        mediaObserver?.disconnect();
        mediaObserver = null;
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -28% 0px",
    }
  );

  mediaObserver.observe(portfolioSection);
}

function renderCollection(strip, collection) {
  if (!strip) {
    return;
  }

  strip.innerHTML = collections[collection].map((item, index) => buildCard(item, collection, index)).join("");
  strip.querySelectorAll(".work-card").forEach((card) => attachCardHandlers(card));
}

export function initWorkGallery() {
  if (initialized) {
    return;
  }

  const longStrip = document.querySelector("[data-work-strip='long']");
  const shortStrip = document.querySelector("[data-work-strip='short']");
  const carousels = document.querySelectorAll(".work-carousel");

  if (!longStrip || !shortStrip || !carousels.length) {
    return;
  }

  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderCollection(longStrip, "long");
  renderCollection(shortStrip, "short");

  carousels.forEach((carousel) => attachCarouselNavs(carousel));
  setupLightbox();
  setupMediaActivation(longStrip);

  initialized = true;
}
