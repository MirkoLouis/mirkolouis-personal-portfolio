// GitHub data: constants, pure helpers for filtering/sorting/merging, and the build-time loader
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CuratedProject, FeaturedProject, GitHubRepo } from "./types";

// GitHub account whose public repos are listed
export const GITHUB_USER = "MirkoLouis";

// Repos never shown in the "More on GitHub" list (matched case-insensitively)
export const EXCLUDED_REPOS: string[] = [
    "skills-introduction-to-github",
    "introduction-to-github",
    "MirkoLouis",
];

// Local dev cache lifetime: 24 hours
export const CACHE_TTL_MS = 86_400_000;

// Maximum rows in the "More on GitHub" list
export const REPO_LIST_LIMIT = 10;

// True when the cache timestamp is valid and younger than the TTL
export function isCacheFresh(fetchedAt: string, now: Date, ttlMs: number): boolean {
    const fetchedMs = Date.parse(fetchedAt);
    // An unparseable timestamp can never be trusted as fresh
    if (Number.isNaN(fetchedMs)) {
        return false;
    }
    return now.getTime() - fetchedMs < ttlMs;
}

// Remove forks, archived repos, excluded names and repos already featured
export function filterRepos(
    repos: GitHubRepo[],
    excludeNames: string[],
    featuredFullNames: string[],
): GitHubRepo[] {
    const excluded = new Set(excludeNames.map((n) => n.toLowerCase()));
    const featured = new Set(featuredFullNames.map((n) => n.toLowerCase()));

    // Keep a repo only if it passes every rule
    return repos.filter((r) =>
        !r.fork
        && !r.archived
        && !excluded.has(r.name.toLowerCase())
        && !featured.has(r.full_name.toLowerCase()));
}

// Newest pushed_at first, cut to n; never mutates the input
export function pickRecent(repos: GitHubRepo[], n: number): GitHubRepo[] {
    return [...repos]
        .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
        .slice(0, n);
}

// Attach live stats to public curated entries whose repo matches (case-insensitive)
export function mergeFeatured(curated: CuratedProject[], repos: GitHubRepo[]): FeaturedProject[] {
    // Index repos by lowercase full name for O(1) lookup
    const byName = new Map(repos.map((r) => [r.full_name.toLowerCase(), r]));

    // Map each curated entry, preserving the curated order
    return curated.map((project) => {
        // Only public projects with a repo field can have live stats
        if (project.visibility !== "public" || !project.repo) {
            return { ...project };
        }
        const match = byName.get(project.repo.toLowerCase());
        // No matching repo on GitHub: render the curated data only
        if (!match) {
            return { ...project };
        }
        return {
            ...project,
            github: {
                stars: match.stargazers_count,
                pushedAt: match.pushed_at,
                language: match.language,
                url: match.html_url,
            },
        };
    });
}

// Link to a project's source: live URL if known, else built from the curated repo (public only)
export function projectCodeUrl(project: FeaturedProject): string | undefined {
    // Live data wins (it carries GitHub's canonical casing)
    if (project.github) {
        return project.github.url;
    }
    // Without live data, public repos still get a link; private/client work never does
    if (project.visibility === "public" && project.repo) {
        return `https://github.com/${project.repo}`;
    }
    return undefined;
}

// Options for loadRepos(); every field has a production default
export interface LoadReposOptions {
    cachePath?: string;
    useCache?: boolean;
    now?: Date;
    fetchImpl?: typeof fetch;
    token?: string;
}

// Shape of the local dev cache file
interface CacheFile {
    fetchedAt: string;
    repos: GitHubRepo[];
}

// Read the cache file; any read or parse problem means "no cache"
async function readCache(path: string): Promise<CacheFile | null> {
    try {
        const parsed = JSON.parse(await readFile(path, "utf8"));
        // Reject files that don't have the expected shape
        if (typeof parsed?.fetchedAt !== "string" || !Array.isArray(parsed?.repos)) {
            return null;
        }
        return parsed as CacheFile;
    } catch {
        return null;
    }
}

// Write the cache file; failures are logged, never thrown
async function writeCache(path: string, data: CacheFile): Promise<void> {
    try {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, JSON.stringify(data));
    } catch (error) {
        console.warn(`[github] could not write cache: ${(error as Error).message}`);
    }
}

// Fetch the user's public repos; throws on network error, non-2xx or a non-array body
async function fetchRepos(fetchImpl: typeof fetch, token: string | undefined): Promise<GitHubRepo[]> {
    const headers: Record<string, string> = {
        "User-Agent": "mirkolouis-portfolio",
        Accept: "application/vnd.github+json",
    };
    // The token is optional; it only raises the rate limit
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`,
        { headers, signal: AbortSignal.timeout(10_000) },
    );
    // Rate limits (403/429) and other errors are failures
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const body = await response.json();
    // Anything other than an array is not a repo list
    if (!Array.isArray(body)) {
        throw new Error("response body is not an array");
    }
    return body as GitHubRepo[];
}

// Load repos once per build: fresh cache -> fetch -> stale cache -> []. Never rejects.
export async function loadRepos(options: LoadReposOptions = {}): Promise<GitHubRepo[]> {
    const {
        cachePath = ".cache/github-repos.json",
        useCache = !process.env.VERCEL,
        now = new Date(),
        fetchImpl = globalThis.fetch,
        token = process.env.GITHUB_TOKEN,
    } = options;

    const cache = useCache ? await readCache(cachePath) : null;

    // 1. Fresh cache: skip the network entirely
    if (cache && isCacheFresh(cache.fetchedAt, now, CACHE_TTL_MS)) {
        console.info("[github] using cache");
        return cache.repos;
    }

    // 2. Fetch, and store the result for the next local build
    try {
        const repos = await fetchRepos(fetchImpl, token);
        // Cache only when caching is enabled (local dev)
        if (useCache) {
            await writeCache(cachePath, { fetchedAt: now.toISOString(), repos });
        }
        return repos;
    } catch (error) {
        console.warn(`[github] fetch failed: ${(error as Error).message}`);
    }

    // 3. Fall back to stale cache, else nothing
    if (cache) {
        console.warn("[github] using stale cache");
        return cache.repos;
    }
    return [];
}
