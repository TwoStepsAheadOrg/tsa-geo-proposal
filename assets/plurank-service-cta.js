(function () {
  const SERVICE_URL = "https://marketing.plurank.com/";

  function applyHomepageCta() {
    const hero = document.querySelector(".xp-hero--plurank");
    if (!hero) return;

    const consultationButton = document.querySelector(
      ".xp-nav--plurank .xp-nav__cta",
    );
    if (consultationButton) {
      consultationButton.hidden = true;
      consultationButton.setAttribute("aria-hidden", "true");
      consultationButton.tabIndex = -1;
    }

    const originalServiceButton = hero.querySelector(
      ".xp-product-switch button:last-child",
    );
    if (originalServiceButton) {
      originalServiceButton.setAttribute("aria-hidden", "true");
      originalServiceButton.tabIndex = -1;
    }

    const preview = hero.querySelector(".xp-hero-product-preview");
    if (!preview || preview.querySelector(".xp-service-cta")) return;

    const cta = document.createElement("a");
    cta.className = "xp-service-cta";
    cta.href = SERVICE_URL;
    cta.textContent = "Plurank 서비스 바로가기";
    cta.setAttribute("aria-label", "Plurank 서비스 바로가기");
    preview.append(cta);
  }

  function start() {
    requestAnimationFrame(() => {
      applyHomepageCta();

      const root = document.getElementById("root");
      if (root) {
        new MutationObserver(applyHomepageCta).observe(root, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
})();
