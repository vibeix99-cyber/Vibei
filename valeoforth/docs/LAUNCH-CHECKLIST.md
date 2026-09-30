# Before this goes public

Nothing below has been done; the site and the Kettle preview are private until approved.

- [ ] Choose the domain; build with `SITE_URL=https://…` (canonical URLs, social image, sitemap).
- [ ] Remove `Disallow: /` from robots.txt (see `build.mjs`).
- [ ] Contact: supply an email and/or links → `src/site.mjs` `contact`. Nothing is shown until set.
- [ ] Kettle live demo: only if you deliberately publish a public build → set `demo: { url, public: true, note }` in `src/rooms/kettle.mjs`. The private Claude artifact link must not be used.
- [ ] Confirm the copy (first-person voice, "private preview" wording) and the facts list on the Kettle page.
- [ ] Confirm you're happy for Chai's SVG artwork and the app screenshots to be public.
- [ ] Pick hosting (any static host; relative URLs; put 404.html at the domain root).
- [ ] Optional: real analytics/no analytics decision; favicon/social image polish.
