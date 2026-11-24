// dom ready bootstrapper
document.addEventListener("DOMContentLoaded", () => {
  initLenis();
  initAnnouncementBanner();
  initMobileNav();
  initScrollspy();
  initStatsCountUp();
});

// initialize Lenis smooth scroll (darkroomengineering/lenis)
function initLenis() {
  if (typeof Lenis === 'undefined') return null;

  // skip on touch devices and reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
  if (prefersReducedMotion || !hasFinePointer) return null;

  const lenis = new Lenis({
    autoRaf: true,
    anchors: {
      offset: -75,
    },
    smoothWheel: true,
    syncTouch: false,
    lerp: 0.16,
    wheelMultiplier: 1.0,
    overscroll: false,
  });

  window.lenis = lenis;
  return lenis;
}

// inject the announcement bar if enabled in config
function initAnnouncementBanner() {
  const bannerContainer = document.getElementById("announcement-banner-container");
  if (!bannerContainer || !window.SITE_CONFIG || !window.SITE_CONFIG.banner) return;

  const cfg = window.SITE_CONFIG.banner;
  if (!cfg.enabled) {
    bannerContainer.style.display = "none";
    return;
  }

  bannerContainer.innerHTML = `
    <aside class="announcement-bar" role="region" aria-label="Announcement">
      <div class="container announcement-inner">
        <a href="${encodeURI(cfg.linkUrl)}" target="_blank" rel="noopener noreferrer" class="announcement-link">
          <span class="announcement-badge">${escapeHtml(cfg.badgeText)}</span>
          <span>${escapeHtml(cfg.message)}</span>
        </a>
      </div>
    </aside>
  `;
}

// mobile nav drawer toggle
function initMobileNav() {
  const toggleBtn = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("open");
  });

  // close drawer when clicking any link
  navMenu.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });

  // close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("open")) {
      navMenu.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.focus();
    }
  });
}

// keep nav link in sync with current viewport section
function initScrollspy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-menu .nav-link");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          if (link.getAttribute("href") === `#${id}`) {
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      }
    });
  }, {
    rootMargin: "-20% 0px -70% 0px"
  });

  sections.forEach(section => observer.observe(section));
}

// sanitize strings before dumping into innerhtml
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// smooth animated count-up helper
function animateCountUp(element, target, options = {}) {
  if (!element) return;
  const {
    duration = 1800,
    prefix = '',
    suffix = '',
    startVal = 0,
  } = options;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || duration <= 0) {
    element.textContent = `${prefix}${target}${suffix}`;
    return;
  }

  let startTime = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const currentVal = Math.round(startVal + (target - startVal) * easedProgress);

    element.textContent = `${prefix}${currentVal}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.textContent = `${prefix}${target}${suffix}`;
    }
  }

  requestAnimationFrame(frame);
}

// animate count-up on elements in "What We Achieved So Far" when visible on user's screen
function initStatsCountUp() {
  const statNumbers = document.querySelectorAll(".stats-grid .stat-number");
  if (!statNumbers.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    statNumbers.forEach(el => {
      const prefix = el.dataset.prefix || (el.textContent.trim().startsWith("+") ? "+" : "");
      const target = parseInt(el.dataset.target || el.textContent.replace(/[^\d]/g, ""), 10);
      if (!isNaN(target)) el.textContent = `${prefix}${target}`;
    });
    return;
  }

  // Pre-initialize display to 0 to prevent snap when scrolling into view
  statNumbers.forEach(el => {
    const prefix = el.dataset.prefix || (el.textContent.trim().startsWith("+") ? "+" : "");
    el.textContent = `${prefix}0`;
  });

  const animateBox = (box) => {
    const el = box.querySelector(".stat-number") || box;
    if (!el || el.dataset.hasCounted) return;
    el.dataset.hasCounted = "true";

    const prefix = el.dataset.prefix || (el.textContent.trim().startsWith("+") ? "+" : "");
    const target = parseInt(el.dataset.target || el.textContent.replace(/[^\d]/g, ""), 10);
    if (isNaN(target)) return;

    animateCountUp(el, target, {
      duration: 1800,
      prefix: prefix,
      startVal: 0,
    });
  };

  const statBoxes = document.querySelectorAll(".stats-grid .stat-box");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
        animateBox(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: [0.15, 0.3, 0.5]
  });

  statBoxes.forEach(box => observer.observe(box));
}
