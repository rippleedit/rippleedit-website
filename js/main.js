document.addEventListener("DOMContentLoaded", () => {
  const steps = Array.from(document.querySelectorAll(".process-step"));

  if (steps.length) {
    // Process section only: reveal each timeline item as it enters the viewport.
    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const step = entry.target;
          const index = steps.indexOf(step);

          if (index !== -1) {
            step.style.transition = "opacity 560ms ease, transform 560ms ease";
            step.style.transitionDelay = `${index * 120}ms`;
            step.classList.add("is-visible");
          }

          observerInstance.unobserve(step);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.25,
      }
    );

    steps.forEach((step) => observer.observe(step));
  }

  // "Find out more" scrolls smoothly to the next section below the hero.
  const scrollBtn = document.querySelector(".hero-scroll");
  const nextSection = document.querySelector(".process");
  if (scrollBtn && nextSection) {
    scrollBtn.addEventListener("click", () => {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const clientsStrip = document.querySelector(".clients-strip");
  const clientsPrev = document.querySelector(".clients-nav--prev");
  const clientsNext = document.querySelector(".clients-nav--next");

  if (clientsStrip && clientsPrev && clientsNext) {
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
});
