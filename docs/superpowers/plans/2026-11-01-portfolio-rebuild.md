# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Express/Handlebars portfolio with a static, light-themed Astro site on Vercel. The site shows curated + live GitHub projects, a grouped tech stack and contact links, and is rebuilt once a day.

**Architecture:** Astro renders everything at build time. `src/lib/github.ts` fetches repos once per build:
- It never throws.
- It keeps a 24 h disk cache for local dev only.
- Its output is merged with curated data in `src/data/`.

GitHub Actions runs CI through a Nix dev shell and triggers a daily Vercel Deploy Hook. Fonts are subset from pinned nixpkgs and committed.

**Tech Stack:** Astro (static output), TypeScript, Vitest, plain CSS, Nix flake (`nixos-26.05`, Node 24), Python fonttools, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-01-portfolio-rebuild-design.md`

## Global Constraints

- 4-space indentation in every file type.
- A short comment on every function, loop, conditional and logical section.
- **Do not `git commit` or `git push`.** Mark commits himself. Each task ends with a checkpoint (`git status --short`) instead.
- Confirm with Mark before deleting anything not listed in Task 1.
- Node `24.x` (`engines.node`), nixpkgs `nixos-26.05`, system `x86_64-linux`.
- Pin exact npm versions (no `^`/`~`) and commit `package-lock.json`.
- Light theme only. Tokens:
  - `--bg #FFFFFF`, `--surface #F4F7F9`, `--text #0B1F2A`, `--muted #4A5B66`, `--border #DCE3E8`
  - `--accent #00A7E1`, `--accent-text #0077A3`
  - Accent-filled buttons use `--text` as the label color.
- Fonts:
  - Inter: general text.
  - Inconsolata Nerd Font: the Projects section and all icons.
  - Both self-hosted from `public/fonts/` with `font-display: swap`.
  - No third-party requests at runtime.
- GitHub username `MirkoLouis`. Exclude list `["skills-introduction-to-github", "introduction-to-github", "MirkoLouis"]`, case-insensitive. Repo list max 10.
- Contact:
  - `mailto:mirkolouis33@gmail.com`
  - `https://www.linkedin.com/in/mark-leo-bagood-146288335/`
  - `https://github.com/MirkoLouis`
- External links use `target="_blank" rel="noopener noreferrer"`.
- Every command below runs inside `nix develop` (prefix `nix develop -c` when not already in the shell). If `nix` is unavailable inside the distrobox container, stop and ask Mark. Do not use `distrobox-host-exec` without asking.

## Review Focus

1. **Rate limit returns 403 with a JSON body** (not a network error). It must count as a failure: fall back to the stale cache, or `[]`. Test in Task 3.
2. **Corrupt or truncated `.cache/github-repos.json`.** Treat it as "no cache" and fetch. Never crash the build. Test in Task 3.
3. **Repo-name case mismatch** between curated `repo` (`MirkoLouis/dts-prototype`) and GitHub `full_name` (`MirkoLouis/DTS-Prototype`). It must still merge, and still be excluded from the repo list. Tests in Task 2.
4. **Only 1–3 screenshots exist** (Mark adds them gradually). The hero columns must still fill and loop seamlessly by repeating items. Test in Task 5.
5. **Few or zero non-featured repos.**
   - 0: the list is hidden.
   - 1–4: shown fully, without fade or expand control.
   - Rule pinned by `shouldCollapse` test in Task 6.

---

### Task 1: Scaffold Astro + Nix dev shell, remove the Express app

**Files:**
- Delete: `app.js`, `routes/`, `views/`, `public/css/`, `public/js/`, `public/images/`, `package-lock.json`
- Rewrite: `package.json`, `.gitignore` (append), `README.md` (stub, finished in Task 8)
- Create: `flake.nix`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro` (placeholder), `.env.example`

**Interfaces:**
- Produces:
  - npm scripts `dev`, `build`, `preview`, `test` (`vitest run`), `check` (`astro check`), `fonts` (`python3 scripts/subset-fonts.py`).
  - Dev-shell env vars `INTER_FONT_DIR` and `INCONSOLATA_NF_DIR`, set to the `${pkgs.inter}` / `${pkgs.nerd-fonts.inconsolata}` store paths.

- [ ] **Step 1: Delete the old app files listed above.** Keep `CHANGELOG.md`, `developer-profile.md`, `docs/`.
- [ ] **Step 2: Append `.cache/` and `.superpowers/` to `.gitignore`.**
- [ ] **Step 3: Write `flake.nix`.**
    - Input: `nixpkgs` = `github:NixOS/nixpkgs/nixos-26.05`.
    - Outputs: `devShells.x86_64-linux.default` with `nodejs_24`, `(python3.withPackages (p: [ p.fonttools p.brotli ]))`, `inter`, `nerd-fonts.inconsolata`.
    - `shellHook` exports the two font dir variables.
    - Run `nix flake lock`.
- [ ] **Step 4: Verify the shell.**
    - Run: `nix develop -c node --version` → expected `v24.*`
    - Run: `nix develop -c bash -c 'echo $INTER_FONT_DIR'` → expected a `/nix/store/...-inter-*` path
    - Run: `nix flake check` → expected exit 0
- [ ] **Step 5: Write `package.json`.**
    - `"name": "mirkolouis-portfolio"`, `"private": true`, `"type": "module"`, `"engines": { "node": "24.x" }`, and the scripts above.
    - Install exact versions: `npm i -E astro` and `npm i -DE vitest @astrojs/check typescript`.
- [ ] **Step 6: Write `astro.config.mjs`** (`output: "static"`, `site` left unset until the Vercel URL exists), `tsconfig.json` (extends `astro/tsconfigs/strict`), `vitest.config.ts` (`test.include: ["tests/**/*.test.ts"]`), and `.env.example` containing `# Optional: raises GitHub API limit to 5000/h\nGITHUB_TOKEN=`.
- [ ] **Step 7: Write a placeholder `src/pages/index.astro`** that renders `<h1>Mark Leo Bagood</h1>`.
- [ ] **Step 8: Verify.**
    - Run: `nix develop -c bash -c "npm run build && npm run check"`
    - Expected: build writes `dist/index.html`; check reports 0 errors.
- [ ] **Step 9: Checkpoint.** `git status --short`. Expect the deletions, new scaffold files, and no `node_modules` or `dist` entries.

---

### Task 2: GitHub data types and pure functions

**Files:**
- Create: `src/lib/types.ts`, `src/lib/github.ts` (pure part), `tests/github.test.ts`

**Interfaces:**
- Produces (in `src/lib/types.ts`):
    - `GitHubRepo { name: string; full_name: string; html_url: string; description: string | null; language: string | null; stargazers_count: number; pushed_at: string; fork: boolean; archived: boolean }`
    - `Visibility = "public" | "private" | "client"`
    - `CuratedProject { slug: string; title: string; summary: string; stack: string[]; screenshots: string[]; visibility: Visibility; repo?: string; demo?: string }`
    - `FeaturedProject extends CuratedProject { github?: { stars: number; pushedAt: string; language: string | null; url: string } }`
- Produces (in `src/lib/github.ts`):
    - `GITHUB_USER = "MirkoLouis"`, `EXCLUDED_REPOS: string[]`, `CACHE_TTL_MS = 86_400_000`, `REPO_LIST_LIMIT = 10`
    - `isCacheFresh(fetchedAt: string, now: Date, ttlMs: number): boolean`
    - `filterRepos(repos: GitHubRepo[], excludeNames: string[], featuredFullNames: string[]): GitHubRepo[]`
    - `pickRecent(repos: GitHubRepo[], n: number): GitHubRepo[]`
    - `mergeFeatured(curated: CuratedProject[], repos: GitHubRepo[]): FeaturedProject[]`

- [ ] **Step 1: Write failing tests** in `tests/github.test.ts`, using a `repo(overrides)` factory.

```ts
describe("isCacheFresh", () => {
    const fetched = "2026-11-01T00:00:00.000Z";
    it("is fresh just under the TTL", () => {
        expect(isCacheFresh(fetched, new Date("2026-11-01T23:59:59.999Z"), CACHE_TTL_MS)).toBe(true);
    });
    it("is stale at exactly the TTL", () => {
        expect(isCacheFresh(fetched, new Date("2026-11-02T00:00:00.000Z"), CACHE_TTL_MS)).toBe(false);
    });
    it("is stale for an unparseable timestamp", () => {
        expect(isCacheFresh("garbage", new Date(), CACHE_TTL_MS)).toBe(false);
    });
});

describe("filterRepos", () => {
    it("drops forks, archived, excluded (case-insensitive) and featured (case-insensitive)", () => {
        const repos = [
            repo({ name: "keep", full_name: "MirkoLouis/keep" }),
            repo({ name: "forked", full_name: "MirkoLouis/forked", fork: true }),
            repo({ name: "old", full_name: "MirkoLouis/old", archived: true }),
            repo({ name: "mirkolouis", full_name: "MirkoLouis/mirkolouis" }),
            repo({ name: "DTS-Prototype", full_name: "MirkoLouis/DTS-Prototype" }),
        ];
        const result = filterRepos(repos, EXCLUDED_REPOS, ["mirkolouis/dts-prototype"]);
        expect(result.map((r) => r.name)).toEqual(["keep"]);
    });
});

describe("pickRecent", () => {
    it("sorts by pushed_at descending and cuts to n", () => {
        const repos = Array.from({ length: 12 }, (_, i) =>
            repo({ name: `r${i}`, pushed_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString() }));
        const result = pickRecent(repos, REPO_LIST_LIMIT);
        expect(result).toHaveLength(10);
        expect(result[0].name).toBe("r11");
        expect(result[9].name).toBe("r2");
    });
    it("does not mutate its input", () => { /* compare input order before/after */ });
});

describe("mergeFeatured", () => {
    it("attaches stats on case-insensitive repo match", () => {
        const curated = [{ slug: "dts", repo: "MirkoLouis/dts-prototype", visibility: "public", ... }];
        const repos = [repo({ full_name: "MirkoLouis/DTS-Prototype", stargazers_count: 3, language: "PHP" })];
        expect(mergeFeatured(curated, repos)[0].github).toEqual({
            stars: 3, pushedAt: repos[0].pushed_at, language: "PHP", url: repos[0].html_url,
        });
    });
    it("leaves github undefined for private/client entries and unmatched repos", () => { ... });
    it("preserves curated order", () => { ... });
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL (module/functions not found).
- [ ] **Step 3: Implement the types and the four functions.**
    - `isCacheFresh` returns `false` when `Date.parse` gives `NaN`, and when `now - fetchedAt >= ttlMs`.
    - All name comparisons lowercase both sides.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS.
- [ ] **Step 5: Checkpoint.** `git status --short`.

---

### Task 3: `loadRepos()`: fetch, disk cache, graceful fallback

**Files:**
- Modify: `src/lib/github.ts`
- Test: `tests/load-repos.test.ts`

**Interfaces:**
- Consumes: `GitHubRepo`, `isCacheFresh`, `CACHE_TTL_MS`, `GITHUB_USER` (Task 2).
- Produces:

```ts
interface LoadReposOptions {
    cachePath?: string;        // default ".cache/github-repos.json"
    useCache?: boolean;        // default !process.env.VERCEL (production always fetches fresh)
    now?: Date;                // default new Date()
    fetchImpl?: typeof fetch;  // default globalThis.fetch
    token?: string;            // default process.env.GITHUB_TOKEN
}
loadRepos(options?: LoadReposOptions): Promise<GitHubRepo[]>   // never rejects
```

Cache file shape: `{ "fetchedAt": "<ISO>", "repos": GitHubRepo[] }`.

- [ ] **Step 1: Write failing tests.** Each test gets its own temp dir via `fs.mkdtemp(os.tmpdir())`, and a stub `fetchImpl` that counts calls.
    - `returns cached repos without fetching when cache is fresh`: fetch call count is `0`.
    - `fetches, returns and writes cache when cache is stale`: count `1`. The file now has the new `fetchedAt` and repos.
    - `fetches when cache file is missing`.
    - `treats corrupt cache JSON as missing and fetches` (Review Focus 2). Write `"{not json"` to the file; expect count `1` and the fetched repos.
    - `returns stale cache when fetch returns 403` (Review Focus 1). The stub returns `new Response(JSON.stringify({ message: "API rate limit exceeded" }), { status: 403 })`.
    - `returns stale cache when fetch rejects` (network error / timeout).
    - `returns [] when fetch fails and no cache exists`.
    - `sends Authorization header only when token is set`. Also asserts `User-Agent: mirkolouis-portfolio` and URL `https://api.github.com/users/MirkoLouis/repos?per_page=100&sort=pushed`.
    - `skips cache read and write when useCache is false`.
    - `does not reject when the cache directory cannot be written`. Point `cachePath` under a read-only path or a file-as-directory.
- [ ] **Step 2: Run** `npm test -- load-repos`. Expected: FAIL.
- [ ] **Step 3: Implement `loadRepos`.**
    - Request: `AbortSignal.timeout(10_000)` and `Accept: application/vnd.github+json`.
    - Non-2xx counts as failure, and so does a body that isn't an array.
    - `mkdir -p` the cache dir before writing.
    - Every failure path does `console.warn("[github] ...")` with a reason and continues.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS.
- [ ] **Step 5: Checkpoint.** `git status --short`.

---

### Task 4: Fonts, icons, global styles, base layout

**Files:**
- Create: `src/lib/icons.json`, `src/lib/icons.ts`, `scripts/subset-fonts.py`, `public/fonts/` (generated woff2s + license files), `src/styles/global.css`, `src/layouts/Base.astro`
- Test: `tests/icons.test.ts`

**Interfaces:**
- Produces:
    - `icons.json`: `{ "<name>": "<hex codepoint>" }`, e.g. `"php": "e73d"`. This is the single source for both the TS code and the Python script.
    - `icons.ts`: `type IconName = keyof typeof icons` and `glyph(name: IconName): string`. It returns the character via `String.fromCodePoint`.
    - `Base.astro` props: `{ title: string; description: string }`. Renders a `<slot />`.
    - CSS: the custom properties from Global Constraints. Font families are `"Inter"` and `"Inconsolata NF"`. Utility class `.icon` sets `font-family: "Inconsolata NF"; font-style: normal`.
- Output files: `public/fonts/inter-latin.woff2`, `inconsolata-nf-regular.woff2`, `inconsolata-nf-bold.woff2`.

- [ ] **Step 1: Pick icon names and verify every codepoint against the actual font.**
    - Names cover every stack item from Task 5's `stack.ts` list, plus `email`, `linkedin`, `github`, `star`, `lock`, `external`.
    - Verify: load `InconsolataNerdFont-Regular.ttf` (found by recursive glob under `$INCONSOLATA_NF_DIR`) with `fontTools.ttLib.TTFont` inside `nix develop`, and check each `int(code, 16)` against `font.getBestCmap()`. Any name whose codepoint is missing gets a generic glyph instead.
- [ ] **Step 2: Write a failing test** `tests/icons.test.ts`.
    - `glyph("php")` equals `String.fromCodePoint(0xe73d)`, using whatever value is verified in Step 1.
    - Every value in `icons.json` matches `/^[0-9a-f]{4,5}$/`.
- [ ] **Step 3: Implement `icons.ts`.** Run `npm test`. Expected: PASS.
- [ ] **Step 4: Write `scripts/subset-fonts.py`.**
    - Locate the TTFs by recursive glob under the env-var dirs: `InterVariable.ttf`, `InconsolataNerdFont-Regular.ttf`, `InconsolataNerdFont-Bold.ttf`.
    - Shared unicode ranges: `U+0020-007E, U+00A0-00FF, U+2013-2014, U+2018-201D, U+2022, U+2026, U+2190-2193`. Inconsolata also gets every `icons.json` codepoint.
    - Call `fontTools.subset` with `flavor="woff2"` and `layout_features=["*"]`.
    - Copy each package's license file (OFL) into `public/fonts/`. Read it first to confirm the Reserved Font Name clause. If an RFN forbids the original name for modified versions, name the family `"Portfolio Mono"`/`"Portfolio Sans"` instead and tell Mark.
    - Exit non-zero with a clear message if any TTF or env var is missing.
- [ ] **Step 5: Run** `nix develop -c npm run fonts`.
    - Expected: three woff2 files plus license files.
    - Sizes: `ls -l public/fonts`. Each woff2 should be under 120 KB. Report the actual sizes.
- [ ] **Step 6: Write `global.css`.**
    - Tokens, `@font-face` ×3 (Inter as a variable font with `font-weight: 100 900`), base element styles, focus-visible ring `2px solid var(--accent)`.
    - Write `Base.astro`: `<html lang="en">`, meta description and viewport, `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-latin.woff2">`, and the global CSS import.
- [ ] **Step 7: Verify.**
    - Point `index.astro` at `Base` and add one `<span class="icon">` per icon.
    - Run `npm run build && npm run check`. Expected: 0 errors.
    - Run `npm run preview` and open the page: Inter text renders, and the icons render as glyphs, not tofu boxes.
- [ ] **Step 8: Checkpoint.** `git status --short`.

---

### Task 5: Curated content and hero showcase

**Files:**
- Create: `src/data/projects.ts`, `src/data/stack.ts`, `src/lib/showcase.ts`, `src/components/Hero.astro`, `src/components/ScreenshotColumns.astro`, `src/components/Nav.astro`
- Test: `tests/showcase.test.ts`

**Interfaces:**
- Consumes: `CuratedProject` (Task 2), `IconName` (Task 4), `Base.astro` (Task 4).
- Produces:
    - `projects.ts`: `curatedProjects: CuratedProject[]` and `showcaseScreenshots: string[]` (empty for now).
    - `stack.ts`: `stackGroups: { title: string; items: { label: string; icon: IconName }[] }[]`
    - `showcase.ts`:
        - `ShowcaseItem { src?: string; color: string; alt: string }`
        - `PLACEHOLDER_COLORS: string[]`: 6 light tints, including `#00A7E1` at reduced alpha and the surface/border tones.
        - `buildShowcaseItems(projects: CuratedProject[], extra: string[], placeholderCount = 12): ShowcaseItem[]`. Every project screenshot plus `extra`. If there are none, returns `placeholderCount` placeholder items with colors cycling through `PLACEHOLDER_COLORS`.
        - `distributeColumns(items: ShowcaseItem[], columnCount: number, minPerColumn: number): ShowcaseItem[][]`. Round-robin into columns, then each column repeats its own items until it has at least `minPerColumn`.

- [ ] **Step 1: Write failing tests.**
    - `buildShowcaseItems` with no screenshots returns 12 placeholders without `src`, with colors cycling.
    - With `screenshots: ["/screenshots/a.webp"]` and `extra: ["/screenshots/b.webp"]`, it returns 2 items with `src`, project first.
    - `distributeColumns(items(3), 4, 4)` (Review Focus 4): 4 columns, each of length ≥ 4, no empty column, every item appears.
    - `distributeColumns(items(12), 4, 3)`: 4 columns of exactly 3, round-robin order (`col0 = [0,4,8]`).
- [ ] **Step 2: Run** `npm test -- showcase`. Expected: FAIL.
- [ ] **Step 3: Implement `showcase.ts`.** Run tests. Expected: PASS.
- [ ] **Step 4: Write `projects.ts`.** Six entries drafted from `developer-profile.md`:
    - DTS-Prototype, CanvasIligan-Ver3, Recruitment-Selection-Process, Meerko's Anime Tracker, Meerko BitTorrent Client, Pounce.
    - Summaries of 1–2 sentences, stack chips from the profile, `screenshots: []`.
    - `visibility` and `repo` are set to `"public"` + `MirkoLouis/<name>` only where that repo appears in the GitHub API response. Otherwise `"private"`.
    - **Ask Mark to confirm visibility, repo names and wording before Task 8.**
- [ ] **Step 5: Write `stack.ts`.** Groups and items:
    - **Frontend:** HTML, CSS, JavaScript, Bootstrap, Handlebars, Astro
    - **Backend:** PHP, Laravel, Node.js, Express, Python, Flask
    - **Databases:** MySQL
    - **DevOps & Linux:** Linux, NixOS, Docker, Git, GitHub Actions, Vercel
    - **Security:** JWT, bcrypt, SHA-256 hash-chaining, Ed25519, CSP, rate limiting
- [ ] **Step 6: Build `ScreenshotColumns.astro`** (props `items: ShowcaseItem[]`). Column count comes from CSS: 4 columns, and 2 below `768px` by hiding columns 3–4.
    - Calls `distributeColumns(items, 4, 6)`.
    - Each column renders its list **twice** in one track.
    - Odd columns animate `translateY(0) → translateY(-50%)`, even columns run the reverse. Durations are `60s, 75s, 55s, 70s`, `linear infinite`. Only `transform` is animated.
    - The grid wrapper is `rotate(-12deg) scale(1.35)`, `aria-hidden="true"`, `pointer-events: none`.
    - Placeholder items are `<div>`s with `aspect-ratio: 16/10; background: <color>`.
    - Real items are `<img alt="" decoding="async">`. The first column is eager-loaded, the others lazy.
    - `@media (prefers-reduced-motion: reduce)`: `animation: none`.
- [ ] **Step 7: Build `Hero.astro`.**
    - Columns behind, then an overlay `linear-gradient(90deg, var(--bg) 0%, rgb(255 255 255 / .85) 45%, rgb(255 255 255 / .2) 100%)`.
    - Foreground: `<h1>` with the name, the tagline "Full-stack developer: interfaces, APIs, databases, and the Linux boxes they run on", and buttons "View projects" → `#projects` (accent fill, `--text` label) and "Contact" → `#contact` (outline).
- [ ] **Step 8: Build `Nav.astro`.** Sticky, links to Projects, Stack and Contact.
- [ ] **Step 9: Wire Nav + Hero into `index.astro`.**
    - Run `npm run build && npm run check`. Expected: 0 errors.
    - Run `npm run preview` and check:
        - Columns move in alternating directions with no visible jump at the loop point.
        - DevTools "Emulate prefers-reduced-motion" freezes them.
        - A 375 px viewport shows 2 columns and no horizontal scroll (`html, body { overflow-x: clip }` on the hero wrapper if needed).
- [ ] **Step 10: Checkpoint.** `git status --short`.

---

### Task 6: Projects section (featured cards + repo list)

**Files:**
- Create: `src/lib/format.ts`, `src/components/FeaturedProjects.astro`, `src/components/RepoList.astro`, `src/components/ProjectsSection.astro`
- Test: `tests/format.test.ts`

**Interfaces:**
- Consumes: `loadRepos`, `filterRepos`, `pickRecent`, `mergeFeatured`, `EXCLUDED_REPOS`, `REPO_LIST_LIMIT` (Tasks 2–3), `curatedProjects` (Task 5), `glyph` (Task 4).
- Produces:
    - `formatRelative(iso: string, now: Date): string`. Returns `"today"`, `"1 day ago"`, `"N days ago"` (<30), `"N months ago"` (<12, `"1 month ago"` singular), `"N years ago"`.
    - `shouldCollapse(count: number): boolean`. True when `count > 4`.
    - `COLLAPSED_ROWS = 4`.
    - `ProjectsSection.astro` (no props): calls `loadRepos()` once in its frontmatter.

- [ ] **Step 1: Write failing tests.**
    - `formatRelative`: boundaries at 0 days, 1 day, 29 days, 30 days ("1 month ago"), 11 months, 12 months ("1 year ago").
    - `shouldCollapse` (Review Focus 5): `0 → false`, `4 → false`, `5 → true`, `10 → true`.
- [ ] **Step 2: Run** `npm test -- format`. Expected: FAIL. Implement. Run again. Expected: PASS.
- [ ] **Step 3: Build `FeaturedProjects.astro`** (props `projects: FeaturedProject[]`, `now: Date`). The whole section uses `font-family: "Inconsolata NF"`. Each card shows:
    - The first screenshot, or a placeholder block in `--surface`.
    - Title and summary.
    - Stack chips, bordered with `--accent`.
    - A badge: `Private` or `Client work` for non-public entries.
    - With `github` data: star glyph + count, language (omitted when `null`, never printed as "null"), "pushed {formatRelative}", and a "View code" link.
    - A `demo` link when present.
- [ ] **Step 4: Build `RepoList.astro`** (props `repos: GitHubRepo[]`, `now: Date`).
    - Renders nothing when `repos.length === 0`.
    - Each row: name (link), description (omitted when `null`), language, relative push date.
    - When `shouldCollapse(repos.length)`:
        - Wrap the rows in `<details>`, with `<summary>` text "Expand" / "Collapse" (swapped via `details[open] summary` CSS).
        - While closed, the visible preview is capped at `COLLAPSED_ROWS` rows with `mask-image: linear-gradient(to bottom, #000 60%, transparent)`. Use the pattern: the first 4 rows are always rendered above the `<details>` inside a masked wrapper, and rows 5–10 are inside the `<details>`. The mask is removed via `:has(details[open])`.
    - Always end with the "View full list on GitHub →" link to `https://github.com/MirkoLouis?tab=repositories`. When collapsible, it appears only once expanded.
- [ ] **Step 5: Build `ProjectsSection.astro`** (`id="projects"`, heading "Projects").
    - `const repos = await loadRepos()`.
    - `featured = mergeFeatured(curatedProjects, repos)`.
    - `featuredNames` = curated `repo` values.
    - `list = pickRecent(filterRepos(repos, EXCLUDED_REPOS, featuredNames), REPO_LIST_LIMIT)`.
    - Render `FeaturedProjects`, then a "More on GitHub" subheading with `RepoList`. The subheading is hidden when the list is empty.
- [ ] **Step 6: Verify.**
    - Add the section to `index.astro`. Run `npm run build` twice:
        - The first run logs a fetch.
        - The second run within 24 h makes no request: fetch is skipped and the cache is used (add a `console.info("[github] using cache")` line in `loadRepos`).
    - Then build with the network blocked: `unshare -rn npm run build`, or temporarily rename `.cache` and set `HTTPS_PROXY=http://127.0.0.1:9`.
        - Expected: build succeeds and a warning is logged.
        - With no cache: the repo list is hidden and the cards have no stats.
    - In preview, check expand/collapse with keyboard (Tab + Enter on summary).
- [ ] **Step 7: Checkpoint.** `git status --short`.

---

### Task 7: Stack, Contact, Footer, final page assembly

**Files:**
- Create: `src/components/Stack.astro`, `src/components/Contact.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `stackGroups` (Task 5), `glyph` (Task 4), `Base`, `Nav`, `Hero`, `ProjectsSection`.

- [ ] **Step 1: Build `Stack.astro`** (`id="stack"`, heading "Stack"). It renders one card per group in a responsive grid (`repeat(auto-fit, minmax(220px, 1fr))`). Each item is `<span class="icon" aria-hidden="true">{glyph(icon)}</span>` followed by the Inter label.
- [ ] **Step 2: Build `Contact.astro`** (`id="contact"`, heading "Contact").
    - Three large link cards: Email (`mailto:mirkolouis33@gmail.com`, visible text is the address), LinkedIn, GitHub.
    - Each has an `aria-hidden` icon and the visible text.
    - LinkedIn and GitHub use the external-link attributes.
- [ ] **Step 3: Build `Footer.astro`.** `© {new Date().getFullYear()} Mark Leo Bagood` plus the three links in small form.
- [ ] **Step 4: Assemble `index.astro`:** `Base` (title "Mark Leo Bagood · Full-Stack Developer", description from the tagline) → Nav → Hero → ProjectsSection → Stack → Contact → Footer.
- [ ] **Step 5: Verify.**
    - Run `npm test && npm run check && npm run build`. Expected: all pass, 0 errors.
    - Preview manual pass at 1280 px and 375 px:
        - Nav anchors scroll to the sections.
        - No horizontal scroll.
        - Focus rings are visible on every link and summary.
        - The DevTools network tab shows no requests to hosts other than the site itself.
- [ ] **Step 6: Checkpoint.** `git status --short`.

---

### Task 8: CI/CD workflows and documentation

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/rebuild.yml`, `CLAUDE.md`
- Rewrite: `README.md`
- Modify: `CHANGELOG.md` (prepend a `## [3.0.0] - 2026-11-01` entry)

- [ ] **Step 1: Write `ci.yml`.**
    - Triggers: `push` (branches `[main]`) and `pull_request`.
    - Job `ubuntu-latest`, `permissions: contents: read`.
    - Steps: `actions/checkout@v4`, `cachix/install-nix-action@v31`, `nix flake check`, then `nix develop --command bash -c "npm ci && npm test && npm run check && npm run build"`.
- [ ] **Step 2: Write `rebuild.yml`.**
    - Triggers: `schedule: - cron: '0 16 * * *'` (comment: 00:00 Asia/Manila) and `workflow_dispatch`.
    - `permissions: {}`.
    - One step: `curl -fsS -X POST "$VERCEL_DEPLOY_HOOK"` with `env: VERCEL_DEPLOY_HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK }}`.
    - A preceding guard step fails with a clear message if the secret is empty.
    - A comment notes this is the documented exception to the "Actions only test" rule.
- [ ] **Step 3: Validate both workflows.** Run `nix run nixpkgs#actionlint -- .github/workflows/*.yml`. Expected: no findings.
- [ ] **Step 4: Write `CLAUDE.md`** from `~/.claude/skills/web-app-stack/templates/project-CLAUDE.md`. Read it first and fill it for this project:
    - Static Astro on Vercel, no DB.
    - Commands: `nix develop`, `npm run dev|build|test|check|fonts`.
    - The font pipeline.
    - The exclude list location.
    - Where to add screenshots (`public/screenshots/` + `projects.ts` / `showcaseScreenshots`).
- [ ] **Step 5: Rewrite `README.md`.**
    - What the site is, the stack, and local dev (`nix develop`, `npm run dev`; works without Nix on Node 24 too).
    - How the daily cache works.
    - How to add projects, screenshots and icons (then `npm run fonts`).
    - **Deploy setup:**
        1. Import the repo in Vercel.
        2. Settings → Git → Deploy Hooks: create a hook for `main`.
        3. GitHub repo → Settings → Secrets → Actions: add `VERCEL_DEPLOY_HOOK`.
        4. Optional: a `GITHUB_TOKEN` env var in Vercel (fine-grained, public repos read-only).
- [ ] **Step 6: Add the CHANGELOG 3.0.0 entry.** Summarize: rebuild to Astro static, theme removed, daily cache, hybrid projects, Nerd Font stack, contact links, CI + daily rebuild.
- [ ] **Step 7: Final verification.**
    - Run `nix flake check && nix develop -c bash -c "npm ci && npm test && npm run check && npm run build"`. Expected: all pass.
    - Then run `git status --short` and report the full change list to Mark for him to commit.

---

## Self-review notes

- **Spec coverage:**
    - Sections 2 and 7 → Tasks 2–3, 6.
    - Section 3 → Task 1, plus new files across tasks.
    - Section 4.1 → Task 5. Section 4.2 → Task 6. Sections 4.3–4.5 → Task 7.
    - Section 5 → Task 4.
    - Section 6 → Tasks 2, 5.
    - Section 8 → Tasks 1, 8.
    - Section 9 → tests in Tasks 2–6 plus manual passes.
    - Section 10 → Global Constraints.
- **Deviation from spec, recorded:**
    - The icon map lives in `src/lib/icons.json` (read by both TS and Python), wrapped by `icons.ts`, instead of a TS-only file.
    - `loadRepos` skips the disk cache when `VERCEL` is set, so a persisted build cache can never serve stale data to a scheduled rebuild.
