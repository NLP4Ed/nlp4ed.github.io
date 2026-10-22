// site links and banner config
const SITE_CONFIG = {
  brand: {
    name: "NLP4Ed",
    domain: "NLP4Ed.com",
    tagline: "Empowering EFL Education Through AI and NLP",
    email: "nlp4ed@gmail.com",
    country: "Morocco"
  },

  // announcement bar at the top
  banner: {
    enabled: true,
    badgeText: "New Video",
    message: "watch our new n8n x corpus linguistics tutorial!",
    linkUrl: "https://youtu.be/QWANnIgvU74",
    dismissible: false
  },

  // featured tool alert
  heroAlert: {
    enabled: true,
    title: "New tool alert!",
    highlightText: "SenseCEFR",
    description: "a Context-Aware Vocabulary Profiler with Word Sense Disambiguation",
    linkText: "Explore SenseCEFR",
    linkUrl: "https://nlp4ed.com/SenseCEFR/"
  },

  // social and outbound urls
  links: {
    resources: "./resources/",
    joinUs: "https://forms.gle/PF9S8bcZaAtJB3YA8",
    appointment: "https://calendly.com/yassine_l/nlp4ed",
    contactEmail: "mailto:nlp4ed@gmail.com",
    social: {
      linkedin: "https://www.linkedin.com/company/nlp4ed/",
      github: "https://github.com/NLP4Ed",
      youtube: "https://www.youtube.com/@NLP4Ed",
      twitter: "https://x.com/NLP4Ed"
    }
  },

  // metric counters
  metrics: [
    { value: "+2", label: "Open-source tools" },
    { value: "+3", label: "Datasets" },
    { value: "+90", label: "Resources" }
  ]
};

if (typeof window !== "undefined") {
  window.SITE_CONFIG = SITE_CONFIG;
}
