import { initSiteMotion } from "./modules/site-motion.js";
import { initSectionReveal } from "./modules/scroll-reveal.js";
import { initProcessReveal } from "./modules/process-reveal.js";
import { initWorkGallery } from "./modules/work-gallery.js";
import { initTrustCarousel } from "./modules/trust-marquee.js";
import { initClientWordsReveal } from "./modules/client-words-reveal.js";
import { initContactForm } from "./modules/contact-form.js";

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motion = initSiteMotion();

document.addEventListener("DOMContentLoaded", () => {
  initSectionReveal();
  initProcessReveal();
  initWorkGallery();
  initTrustCarousel();
  initClientWordsReveal();
  initContactForm();

  const scrollBtn = document.querySelector(".hero-scroll");
  const nextSection = document.querySelector(".process");

  if (scrollBtn && nextSection) {
    scrollBtn.addEventListener("click", () => {
      motion.scrollTo(nextSection, {
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  const heroBrand = document.querySelector(".brand[href='#top']");
  if (heroBrand) {
    heroBrand.addEventListener("click", (event) => {
      event.preventDefault();
      motion.scrollTo(document.querySelector("#top"), {
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }
});
