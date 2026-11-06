# mirkolouis-portfolio

Uses the `web-app-stack` skill. Shape: **Vercel**, static Astro site, no database, no server.

## Rules for this repo

- The site is fully static. GitHub data is fetched at build time only, never from the browser.
- `src/lib/github.ts` `loadRepos()` must never throw: a GitHub failure degrades the page, never the build.
- Local dev caches GitHub data in `.cache/github-repos.json` for 24 h; on Vercel (`VERCEL` env set) the cache is skipped.
- Fonts are self-hosted subsets in `public/fonts/`. After changing `src/lib/icons.json`, run `npm run fonts` inside `nix develop` and commit the new woff2 files.
- Light theme only. Colors only through the `:root` tokens in `src/styles/global.css`.
  Use `--accent-text` (not `--accent`) for text and links; `#00A7E1` on white fails WCAG AA.
- Inter for general text; Inconsolata Nerd Font for the Projects section and all icons.
- Icons are decorative: `aria-hidden="true"` next to a visible text label.
- 4-space indentation; a short comment on every function, loop, conditional and logical section.
- Never commit secrets; update `.env.example` when adding a variable.

## Where things live

- Identity and contact links: `src/data/site.ts`
- Featured projects and background-only screenshots (`showcaseScreenshots`): `src/data/projects.ts`
- About me text and professional photo: `src/data/about.ts` (photo in `src/assets/about/`, served via `astro:assets`)
- NixOS section text and flake excerpt: `src/data/nixos.ts`
- Stack groups: `src/data/stack.ts`
- Repo exclude list: `EXCLUDED_REPOS` in `src/lib/github.ts`
- Screenshots: `src/assets/screenshots/<Project>/`, imported in `src/data/projects.ts` (served via `astro:assets`)

## Commands

- Dev shell: `nix develop`
- Dev server: `npm run dev`
- Tests: `npm test`
- Type check: `npm run check`
- Build: `npm run build`
- Regenerate fonts: `npm run fonts` (needs `nix develop`)
