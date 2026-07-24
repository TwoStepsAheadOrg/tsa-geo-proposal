(function () {
  const ABOUT_OFFSET = 86;
  const MAX_FRAMES = 120;
  const CORRECTION_FRAMES = 45;
  const SERVICE_URL = "https://marketing.plurank.com/";

  function isPlurankSwitchButton(target) {
    const button = target.closest(".xp-product-switch button");
    if (!button) return false;

    return button.textContent.trim() === "Plurank";
  }

  function alignAboutSection() {
    let frame = 0;
    let stableFrames = 0;
    let previousDocumentTop = null;

    function measure() {
      frame += 1;

      const route = document.querySelector(".xp-route--plurank");
      const about = document.getElementById("about");

      if (!route || !about) {
        if (frame < MAX_FRAMES) requestAnimationFrame(measure);
        return;
      }

      const rect = about.getBoundingClientRect();
      const documentTop = rect.top + window.scrollY;
      const routeStyle = getComputedStyle(route);
      const routeIsSettled =
        routeStyle.transform === "none" ||
        routeStyle.transform === "matrix(1, 0, 0, 1, 0, 0)";

      if (
        previousDocumentTop !== null &&
        Math.abs(documentTop - previousDocumentTop) < 0.5 &&
        routeIsSettled
      ) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }

      previousDocumentTop = documentTop;

      if (stableFrames >= 4 || frame >= MAX_FRAMES) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetTop = Math.min(
          Math.max(0, documentTop - ABOUT_OFFSET),
          Math.max(0, maxScroll),
        );

        window.scrollTo({ top: targetTop, behavior: "auto" });
        keepAboutAligned(CORRECTION_FRAMES);
        return;
      }

      requestAnimationFrame(measure);
    }

    requestAnimationFrame(measure);
  }

  function keepAboutAligned(framesRemaining) {
    const about = document.getElementById("about");
    if (!about || framesRemaining <= 0) return;

    const delta = about.getBoundingClientRect().top - ABOUT_OFFSET;
    if (Math.abs(delta) >= 0.5) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + delta),
        behavior: "auto",
      });
    }

    requestAnimationFrame(() => keepAboutAligned(framesRemaining - 1));
  }

  function ensureLaptopServiceCta() {
    const preview = document.querySelector(
      ".xp-hero--plurank .xp-hero-product-preview",
    );
    if (!preview || preview.querySelector(".xp-laptop-service-cta")) return;

    const link = document.createElement("a");
    link.className = "xp-laptop-service-cta";
    link.href = SERVICE_URL;
    link.textContent = "Plurank 서비스 바로가기";
    link.setAttribute("aria-label", "Plurank 서비스 바로가기");
    preview.append(link);
  }

  function startHeroEnhancements() {
    requestAnimationFrame(() => {
      ensureLaptopServiceCta();

      const root = document.getElementById("root");
      if (!root) return;

      new MutationObserver(ensureLaptopServiceCta).observe(root, {
        childList: true,
        subtree: true,
      });
    });
  }

  window.addEventListener(
    "click",
    (event) => {
      if (!location.pathname.startsWith("/consulting")) return;
      if (!isPlurankSwitchButton(event.target)) return;

      alignAboutSection();
    },
    { capture: true },
  );

  if (document.readyState === "complete") {
    startHeroEnhancements();
  } else {
    window.addEventListener("load", startHeroEnhancements, { once: true });
  }
})();
