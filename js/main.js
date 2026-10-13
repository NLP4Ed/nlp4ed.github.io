// dom ready bootstrapper
document.addEventListener("DOMContentLoaded", () => {
  initAnnouncementBanner();
  initMobileNav();
  initScrollspy();
});

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
          <svg class="icon announcement-arrow" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
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
