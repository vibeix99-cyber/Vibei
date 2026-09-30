// Site-wide facts. Anything not known yet is left null so nothing gets invented.
export const site = {
  name: 'Valeoforth',
  tagline: 'A house for the things I build.',
  description:
    'Valeoforth is a home for the projects I build — each one gets its own room. Step into Kettle, a cozy focus timer with a capybara called Chai.',
  year: 2026,
  // Set SITE_URL (e.g. https://valeoforth.example) at build time to emit canonical + social-image URLs.
  url: process.env.SITE_URL || null,
  // Contact details are intentionally empty until supplied. When set, they appear in the footer.
  contact: { email: null, links: [] },
};
