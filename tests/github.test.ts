// Unit tests for the pure GitHub data functions (no network, no filesystem)
import { describe, expect, it } from "vitest";
import {
    CACHE_TTL_MS,
    EXCLUDED_REPOS,
    REPO_LIST_LIMIT,
    filterRepos,
    isCacheFresh,
    mergeFeatured,
    pickRecent,
    projectCodeUrl,
} from "../src/lib/github";
import type { CuratedProject, GitHubRepo } from "../src/lib/types";

// Build a GitHubRepo with sensible defaults, overridden per test
function repo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
    const name = overrides.name ?? "sample";
    return {
        name,
        full_name: `MirkoLouis/${name}`,
        html_url: `https://github.com/MirkoLouis/${name}`,
        description: null,
        language: null,
        stargazers_count: 0,
        pushed_at: "2026-01-01T00:00:00Z",
        fork: false,
        archived: false,
        ...overrides,
    };
}

// Build a CuratedProject with sensible defaults, overridden per test
function curated(overrides: Partial<CuratedProject> = {}): CuratedProject {
    return {
        slug: "sample",
        title: "Sample",
        summary: "A sample project.",
        stack: [],
        screenshots: [],
        visibility: "public",
        ...overrides,
    };
}

// Cache freshness: TTL boundary and invalid timestamps
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

// Filtering: forks, archived, excluded names and featured repos are removed
describe("filterRepos", () => {
    it("drops forks, archived, excluded (case-insensitive) and featured (case-insensitive)", () => {
        const repos = [
            repo({ name: "keep" }),
            repo({ name: "forked", fork: true }),
            repo({ name: "old", archived: true }),
            repo({ name: "mirkolouis" }),
            repo({ name: "DTS-Prototype" }),
        ];
        const result = filterRepos(repos, EXCLUDED_REPOS, ["mirkolouis/dts-prototype"]);
        expect(result.map((r) => r.name)).toEqual(["keep"]);
    });
});

// Recency: newest pushed_at first, cut to the limit
describe("pickRecent", () => {
    // Twelve repos pushed on consecutive days in January
    const repos = Array.from({ length: 12 }, (_, i) =>
        repo({ name: `r${i}`, pushed_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString() }));

    it("sorts by pushed_at descending and cuts to n", () => {
        const result = pickRecent(repos, REPO_LIST_LIMIT);
        expect(result).toHaveLength(10);
        expect(result[0].name).toBe("r11");
        expect(result[9].name).toBe("r2");
    });

    it("does not mutate its input", () => {
        const before = repos.map((r) => r.name);
        pickRecent(repos, REPO_LIST_LIMIT);
        expect(repos.map((r) => r.name)).toEqual(before);
    });
});

// Merging live GitHub stats into curated entries
describe("mergeFeatured", () => {
    it("attaches stats on case-insensitive repo match", () => {
        const projects = [curated({ slug: "dts", repo: "MirkoLouis/dts-prototype" })];
        const repos = [repo({ name: "DTS-Prototype", stargazers_count: 3, language: "PHP" })];
        expect(mergeFeatured(projects, repos)[0].github).toEqual({
            stars: 3,
            pushedAt: repos[0].pushed_at,
            language: "PHP",
            url: repos[0].html_url,
        });
    });

    it("leaves github undefined for private/client entries and unmatched repos", () => {
        const projects = [
            curated({ slug: "priv", visibility: "private" }),
            curated({ slug: "client", visibility: "client" }),
            curated({ slug: "missing", repo: "MirkoLouis/not-on-github" }),
        ];
        const result = mergeFeatured(projects, [repo({ name: "other" })]);
        expect(result.map((p) => p.github)).toEqual([undefined, undefined, undefined]);
    });

    it("preserves curated order", () => {
        const projects = [curated({ slug: "b" }), curated({ slug: "a" }), curated({ slug: "c" })];
        expect(mergeFeatured(projects, []).map((p) => p.slug)).toEqual(["b", "a", "c"]);
    });
});

// Code link: live URL when known, otherwise built from the curated repo (public only)
describe("projectCodeUrl", () => {
    it("falls back to the curated repo URL when GitHub data is missing", () => {
        const [project] = mergeFeatured([curated({ repo: "MirkoLouis/DTS-Prototype" })], []);
        expect(projectCodeUrl(project)).toBe("https://github.com/MirkoLouis/DTS-Prototype");
    });

    it("prefers the live html_url when present", () => {
        const [project] = mergeFeatured(
            [curated({ repo: "MirkoLouis/dts-prototype" })],
            [repo({ name: "DTS-Prototype" })],
        );
        expect(projectCodeUrl(project)).toBe("https://github.com/MirkoLouis/DTS-Prototype");
    });

    it("returns undefined for private and client work even with a repo field", () => {
        const [project] = mergeFeatured([curated({ visibility: "private", repo: "MirkoLouis/secret" })], []);
        expect(projectCodeUrl(project)).toBeUndefined();
    });
});
