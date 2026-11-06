# Portfolio Rebuild: Design Spec

- **Date:** 2026-11-01
- **Owner:** Mark (MirkoLouis)
- **Status:** Draft, awaiting review

## 1. Goal

Replace the MW2/Lilith-themed Express + Handlebars portfolio with a static Astro site deployed on Vercel.
The site must show that Mark builds both frontend and backend, list his projects (including private and
client work), present his technology stack, and give clear ways to contact him.

### Success criteria
- The GitHub API is contacted at most once per build. Builds happen on push to `main` and once a day
  via a scheduled rebuild. Local dev restarts do not call GitHub while the cache is fresh (24 h TTL).
- A failing or rate-limited GitHub API never fails the build.
- Lighthouse-friendly static output: no runtime server, no client-side calls to third parties,
  self-hosted fonts.
- Works on phone widths and respects `prefers-reduced-motion`.

### Out of scope
- Contact form (replaced by links), blog, CMS, analytics, dark theme, experience/timeline section,
  skill percentage bars.

## 2. Architecture

```
GitHub Actions cron (daily) ──POST──► Vercel Deploy Hook ─┐
git push main ────────────────────────────────────────────┼─► Vercel build: `astro build`
                                                          │     ├─ src/lib/github.ts → api.github.com (once)
                                                          │     ├─ src/data/projects.ts (curated)
                                                          │     └─ merge → static HTML/CSS
                                                          └─► Vercel CDN → visitors
```

- **Static site generation.** Astro renders everything at build time. No SSR adapter, no API routes.
- **Caching model.**
  - Production: the "cache" is the built page itself. It is refreshed by the daily rebuild.
  - Local dev: `src/lib/github.ts` writes `.cache/github-repos.json` (`{ fetchedAt, repos }`). If
    `fetchedAt` is younger than 24 h, the file is used instead of the API. `.cache/` is gitignored.
- **Hosting:** Vercel Hobby (personal, non-commercial), via Git integration: push to `main` deploys
  production, PRs get preview URLs.

## 3. Repository layout

The rebuild happens in place in the existing repo (`MirkoLouis/mirkolouis-personal-portfolio`).

```
flake.nix / flake.lock         # devShell: Node 24, python3 + fonttools + brotli,
                               #   nerd-fonts.inconsolata, inter
package.json                   # astro, vitest; "engines": { "node": "24.x" }
astro.config.mjs
tsconfig.json
scripts/subset-fonts.py        # Nix store TTFs → public/fonts/*.woff2 (output committed)
src/
├── data/projects.ts           # curated project entries
├── data/stack.ts              # grouped technologies + icon names
├── lib/github.ts              # fetch, cache, filter, sort, merge
├── lib/icons.ts               # icon name → Nerd Font codepoint (also read by subset script)
├── components/
│   ├── Nav.astro
│   ├── Hero.astro
│   ├── ScreenshotColumns.astro
│   ├── FeaturedProjects.astro
│   ├── RepoList.astro
│   ├── Stack.astro
│   ├── Contact.astro
│   └── Footer.astro
├── layouts/Base.astro
├── pages/index.astro
└── styles/global.css          # :root tokens, @font-face, base styles
public/
├── fonts/                     # subset woff2 files (committed)
└── screenshots/               # placeholders now, real screenshots later
tests/github.test.ts
.github/workflows/ci.yml
.github/workflows/rebuild.yml
CLAUDE.md                      # from web-app-stack templates/project-CLAUDE.md
README.md                      # rewritten
CHANGELOG.md                   # kept; new 3.0.0 entry for the rebuild
.gitignore                     # add .cache/ and .superpowers/
```

**Removed** (they remain in git history): `app.js`, `routes/`, `views/`, `public/css/`, `public/js/`,
`public/images/lilith-background.jpg`, `package-lock.json` (regenerated), and the `express`, `hbs`,
`axios`, `nodemon` dependencies. `CHANGELOG.md` is kept.

## 4. Page sections

Single page, in this order. The sticky nav links to `#projects`, `#stack`, `#contact`.

### 4.1 Hero
- **Background: `ScreenshotColumns.astro`**
  - 4 columns of screenshot cards. The whole grid is rotated about −12° and scaled up so the corners
    stay covered.
  - Odd columns scroll upward and even columns scroll downward.
  - Seamless loop: each column renders its image list twice. A `linear infinite` keyframe animates
    `transform: translateY(0 → -50%)` (reversed for downward columns). Each column gets a slightly
    different duration.
  - Only `transform` is animated (compositor-only, no layout or paint per frame). Images use
    `loading="eager"` for the first column and `decoding="async"`.
  - A white-to-transparent gradient overlay keeps the foreground text readable.
  - Below 768 px: 2 columns.
  - With `prefers-reduced-motion: reduce`: animation off, columns static.
  - Image source: the `screenshots` of all curated projects, plus an optional
    `showcaseScreenshots` array in `src/data/projects.ts` for images shown only in the
    hero background (not on any project card).
  - Placeholders: until real screenshots exist, each entry renders as a solid-color 16:10 block
    from a fixed palette.
- **Foreground:** name, a one-line tagline (e.g. "Full-stack developer: interfaces, APIs, databases,
  and the Linux boxes they run on"), and two buttons: "View projects" (`#projects`) and
  "Contact" (`#contact`).

### 4.2 Projects (font: Inconsolata Nerd Font)
- **Featured cards (`FeaturedProjects.astro`)**
  - Title, summary, stack chips, first screenshot, visibility badge.
  - Public repos also show stars, last push (relative date), primary language, and a "View code" link.
  - Private and client projects show a "Private" or "Client work" badge, no repo link, and an
    optional demo link.
- **Repo list (`RepoList.astro`)**
  - Up to 10 public repos, newest `pushed_at` first. Excluded: forks, names in the exclude list,
    and repos already featured.
  - Collapsed: list height capped at about 4 rows, faded out with
    `mask-image: linear-gradient(to bottom, #000 60%, transparent)`.
  - Expand via `<details>`/`<summary>` (no JS). Expanded: mask and cap removed, all 10 rows shown,
    followed by a "View full list on GitHub →" link to
    `https://github.com/MirkoLouis?tab=repositories`.
  - Hidden entirely if no GitHub data is available.

### 4.3 Stack
- Groups: Frontend, Backend, Databases, DevOps & Linux, Security.
- Each item: Nerd Font icon (`aria-hidden="true"`) and a text label in Inter.
- Items without a dedicated logo glyph use a generic glyph (lock, database, network). Codepoints are
  verified against the font during implementation, not assumed.

### 4.4 Contact
Three large links, each with an icon:
- Email: `mailto:mirkolouis33@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/mark-leo-bagood-146288335/`
- GitHub: `https://github.com/MirkoLouis`

External links use `target="_blank" rel="noopener noreferrer"`.

### 4.5 Footer
Name, copyright with the year generated at build time, and the same three links in small form.

## 5. Visual style

- **Theme: light only.**
- **Color tokens (`:root` in `global.css`):**
  - `--bg: #FFFFFF`, `--surface: #F4F7F9`, `--text: #0B1F2A`, `--muted: #4A5B66`,
    `--border: #DCE3E8`.
  - `--accent: #00A7E1` ("Fresh Sky"). Used for fills, borders, focus rings, icons, and the
    hero highlight.
  - `--accent-text: #0077A3`. Used for links and accent-colored text.
    - Why a second shade: `#00A7E1` on white is about 2.8:1 contrast, below the WCAG AA
      4.5:1 for body text. `#0077A3` is about 5:1.
  - Buttons with an `--accent` fill use `--text` (`#0B1F2A`) as the label color (about 6:1),
    not white.
- **Fonts**
  - Inter (variable, Latin subset, one woff2) for all general text.
  - Inconsolata Nerd Font (Regular + Bold) for the Projects section and all icons.
  - Both use `font-display: swap`; Inter Regular is preloaded.
  - Fallbacks:
    - Inter: `system-ui, -apple-system, "Segoe UI", sans-serif`
    - Inconsolata: `ui-monospace, "Cascadia Mono", Consolas, monospace`
- **Font pipeline (`scripts/subset-fonts.py`, run as `npm run fonts` inside `nix develop`)**
  - Reads TTFs from the Nix store paths of `nerd-fonts.inconsolata` and `inter` (exposed by the dev
    shell as environment variables).
  - Subsets to Basic Latin + Latin-1 punctuation; Inconsolata also gets the codepoints listed in
    `src/lib/icons.ts`.
  - Writes `public/fonts/*.woff2`.
  - Output is committed, so the Vercel build needs neither Python nor Nix.
  - The OFL license text of both fonts is read during implementation to confirm Reserved Font Name
    rules before naming the subset files. The license files are shipped in `public/fonts/`.

## 6. Data model

```ts
// src/data/projects.ts
type Visibility = "public" | "private" | "client";

interface CuratedProject {
    slug: string;                // stable id, also used to match GitHub repo
    title: string;
    summary: string;             // 1-2 sentences
    stack: string[];             // labels, shown as chips
    screenshots: string[];       // paths under /screenshots/
    visibility: Visibility;
    repo?: string;               // "MirkoLouis/<name>", public only
    demo?: string;               // optional live URL
}

// merged at build time
interface FeaturedProject extends CuratedProject {
    github?: { stars: number; pushedAt: string; language: string | null; url: string };
}
```

Initial curated entries (content drafted from `developer-profile.md`, for Mark to edit):
DTS-Prototype, CanvasIligan-Ver3, Recruitment-Selection-Process, Meerko's Anime Tracker,
Meerko BitTorrent Client, Pounce. Visibility and repo names are confirmed with Mark during
implementation.

`src/data/stack.ts` holds the groups from 4.3, each item as `{ label, icon }`, where `icon` is a key of
`src/lib/icons.ts`.

## 7. GitHub integration (`src/lib/github.ts`)

- **Request:** `GET https://api.github.com/users/MirkoLouis/repos?per_page=100&sort=pushed`
  - Headers: `User-Agent: mirkolouis-portfolio`, `Accept: application/vnd.github+json`, plus
    `Authorization: Bearer $GITHUB_TOKEN` if set.
  - 10 s timeout (`AbortSignal.timeout`).
- **Pure functions (unit tested)**
  - `isCacheFresh(fetchedAt, now, ttlMs)`
  - `filterRepos(repos, excludeNames, featuredRepoNames)`: drops forks, archived repos, excluded
    names, and featured repos.
  - `pickRecent(repos, n)`: sorts by `pushed_at` descending and takes the first `n` (10).
  - `mergeFeatured(curated, repos)`: attaches `github` stats to curated public entries whose `repo`
    matches.
- **I/O wrapper `loadRepos()`**
  1. If the cache file exists and is fresh, return it.
  2. Otherwise fetch. On success, write the cache and return the result.
  3. On failure (network, timeout, non-2xx, including 403/429 rate limits), log a warning. Return the
     stale cache if it exists, otherwise `[]`.
  4. Never throw, so the build cannot fail because of GitHub.
- **Exclude list:** a constant in `github.ts`, initially `["skills-introduction-to-github",
  "introduction-to-github", "MirkoLouis"]`, matched case-insensitively.
- **Token:** `GITHUB_TOKEN` is optional (raises the limit from 60 to 5,000 requests/hour). If used, it
  is a fine-grained token with public-repo read-only access, stored in Vercel env vars and never
  committed.
- **Private repo stats:** never fetched.

## 8. CI/CD

- **`.github/workflows/ci.yml`** (push to `main`, pull requests)
  - Runner: `ubuntu-latest`.
  - Steps:
    1. `actions/checkout`
    2. `cachix/install-nix-action@v31`
    3. `nix flake check`
    4. `nix develop --command bash -c "npm ci && npm test && npx astro check && npm run build"`
- **`.github/workflows/rebuild.yml`**
  - Triggers: `schedule: cron '0 16 * * *'` (00:00 Asia/Manila) and `workflow_dispatch`.
  - One step: `curl -fsS -X POST "$VERCEL_DEPLOY_HOOK"`, with the URL from the repo secret
    `VERCEL_DEPLOY_HOOK`.
  - This only triggers a Vercel rebuild and deploys nothing itself. It is a deliberate, documented
    exception to the web-app-stack rule that Actions only test.
- **Vercel:** Git integration deploys. Node version comes from `engines.node` (`24.x`), matching the
  dev shell.
- **Manual setup (documented in README):**
  - Import the repo in Vercel.
  - Create a Deploy Hook for `main`.
  - Add it as the `VERCEL_DEPLOY_HOOK` GitHub secret.
  - Optionally add `GITHUB_TOKEN` in Vercel.
- **`flake.nix`**
  - nixpkgs pinned to `nixos-26.05`, system `x86_64-linux`.
  - `devShells.default`: `nodejs_24`, `python3` with `fonttools` and `brotli`,
    `nerd-fonts.inconsolata`, `inter`.
  - `shellHook` exports the font store paths for the subset script.

## 9. Testing

- **Vitest unit tests (`tests/github.test.ts`), written test-first**
  - Cache TTL boundaries.
  - Fork, archived, excluded and featured filtering.
  - Case-insensitive exclusion.
  - Recency sort and top-10 cut.
  - Merge with matching and non-matching repos.
  - `loadRepos` fallbacks (fresh cache, stale cache on fetch error, empty on error with no cache),
    with `fetch` and the filesystem mocked.
- **Static checks:** `astro check` for type and template errors.
- **Integration:** `npm run build` succeeds both with network access and with GitHub unreachable.
- **Manual pass in a browser**
  - Hero animation (both directions, seamless loop).
  - Reduced-motion behavior.
  - Phone width (no horizontal scroll).
  - Repo list collapse/expand.
  - Keyboard focus visibility.

## 10. Conventions

- 4-space indentation.
- A short comment on every function, loop, conditional and logical section (global CLAUDE.md).
- Component-scoped `<style>` blocks in `.astro` files. Shared values only through `:root` tokens.
- No secrets in the repo. `.env.example` lists `GITHUB_TOKEN` (optional).

## 11. Open items (resolved during implementation, not blocking)

- Final tagline wording and project summaries (drafted, then Mark edits).
- Visibility and repo name for each curated project.
- Real screenshots (Mark provides them; placeholders until then). Client screenshots must have
  sensitive data removed and client permission.
- Exact Nerd Font codepoints per stack item (verified against the font).
