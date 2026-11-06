# Mark Leo Bagood: Portfolio

My personal portfolio: featured projects (with live GitHub stats), my most recently updated repos,
the technologies I work with, and how to reach me.

**Stack:** Astro (static output) · TypeScript · plain CSS · Vitest · Nix flake dev shell ·
GitHub Actions · Vercel

## Local development

With Nix (recommended, pins Node 24 and the font tooling):

```bash
nix develop
npm ci
npm run dev        # http://localhost:4321
```

Without Nix, any Node 24 works for everything except `npm run fonts`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run check` | Type and template check (`astro check`) |
| `npm run build` | Static build into `dist/` |
| `npm run fonts` | Re-subset the fonts into `public/fonts/` (inside `nix develop`) |

## How GitHub data is cached

The GitHub API is only called while the site is **built**, never by visitors.

- **Production:** Vercel builds on every push to `main`, and a scheduled GitHub Action
  (`.github/workflows/rebuild.yml`) triggers one rebuild a day at 00:00 Asia/Manila. So the API is
  contacted about once a day.
- **Local dev:** results are cached in `.cache/github-repos.json` for 24 h, so restarting the dev
  server doesn't spend the 60 requests/hour unauthenticated limit.
- **If GitHub is down or rate-limited** the build still succeeds: it uses the stale cache if there is
  one, otherwise featured cards render without stats and the repo list is hidden.

## Editing content

- **Projects:** `src/data/projects.ts`. Each entry has a title, summary, stack chips,
  screenshots, visibility (`public` / `private` / `client`) and an optional `repo` and `demo`.
  Public entries with a `repo` get live stars, language and last-push date.
- **Screenshots:** put images in `src/assets/screenshots/<Project>/`, import them at the top of
  `src/data/projects.ts` and add them to the project's `screenshots`. Astro resizes them and converts
  them to WebP. Set `objectPosition` (e.g. `"top"`) on a project to control how its screenshots crop. Every project screenshot also appears in the scrolling screenshot background;
  `showcaseScreenshots` adds background-only images. Until there are any, colored placeholders are shown.
- **About me:** `src/data/about.ts` holds the introduction text and the professional photo
  (`src/assets/about/`). Astro resizes the photo and converts it to WebP at build time, which also
  strips its metadata.
- **Stack:** `src/data/stack.ts`. Icons come from `src/lib/icons.json` (Nerd Font codepoints).
  After adding an icon, run `npm run fonts` in `nix develop` and commit the regenerated fonts.
- **Hidden repos:** `EXCLUDED_REPOS` in `src/lib/github.ts`. Forks and archived repos are always hidden.

## Deploy setup (one time)

1. Import this repository in Vercel (framework preset: Astro). Push to `main` deploys production;
   pull requests get preview URLs.
2. Vercel → Project → Settings → Git → **Deploy Hooks**: create a hook for branch `main` and copy its URL.
3. GitHub → this repo → Settings → Secrets and variables → Actions: add the secret
   `VERCEL_DEPLOY_HOOK` with that URL.
4. **Recommended:** in Vercel → Settings → Environment Variables, add `GITHUB_TOKEN` (a fine-grained
   token with read-only access to public repositories). Vercel build machines share outbound IPs, so
   the unauthenticated 60 requests/hour limit can be exhausted by others; the token raises it to 5,000.
   Without live data the cards still link to their repos, but stats and the repo list disappear
   until the next successful build.

> **Scheduled workflows pause after 60 days of inactivity.** GitHub disables `schedule` triggers in
> public repos when nothing has been pushed for 60 days, and the daily rebuild stops silently.
> If the "pushed N days ago" dates look frozen, open GitHub → Actions → **Daily rebuild** →
> **Enable workflow** (or push any commit).

## Fonts

Inter and Inconsolata Nerd Font are subset from pinned nixpkgs by `scripts/subset-fonts.py` and
self-hosted. Both are licensed under the SIL Open Font License 1.1 (see `public/fonts/*-OFL.txt`).
