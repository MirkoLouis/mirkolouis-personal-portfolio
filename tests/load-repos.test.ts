// Tests for loadRepos(): disk cache, fetch, and graceful fallback (never rejects)
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadRepos } from "../src/lib/github";
import type { GitHubRepo } from "../src/lib/types";

const NOW = new Date("2026-11-01T12:00:00.000Z");
const FRESH = "2026-11-01T00:00:00.000Z"; // 12 h old
const STALE = "2026-10-30T00:00:00.000Z"; // > 24 h old

// Minimal repo fixture
function repo(name: string): GitHubRepo {
    return {
        name,
        full_name: `MirkoLouis/${name}`,
        html_url: `https://github.com/MirkoLouis/${name}`,
        description: null,
        language: null,
        stargazers_count: 0,
        pushed_at: "2026-10-01T00:00:00Z",
        fork: false,
        archived: false,
    };
}

// A fetch stub that records calls and replies with a fixed Response (or throws)
function stubFetch(reply: () => Response | Promise<Response>) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const impl = (async (url: string, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        return reply();
    }) as unknown as typeof fetch;
    return { impl, calls };
}

// JSON 200 response with the given repos
const okResponse = (repos: GitHubRepo[]) => () => new Response(JSON.stringify(repos), { status: 200 });

let dir: string;
let cachePath: string;

// Fresh temp dir per test; silence expected warnings
beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "repos-"));
    cachePath = join(dir, "nested", "github-repos.json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
});

// Write a cache file with the given timestamp and repos
async function writeCache(fetchedAt: string, repos: GitHubRepo[]) {
    await import("node:fs/promises").then((fs) => fs.mkdir(join(dir, "nested"), { recursive: true }));
    await writeFile(cachePath, JSON.stringify({ fetchedAt, repos }));
}

describe("loadRepos", () => {
    it("returns cached repos without fetching when cache is fresh", async () => {
        await writeCache(FRESH, [repo("cached")]);
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(f.calls).toHaveLength(0);
        expect(result.map((r) => r.name)).toEqual(["cached"]);
    });

    it("fetches, returns and writes cache when cache is stale", async () => {
        await writeCache(STALE, [repo("cached")]);
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(f.calls).toHaveLength(1);
        expect(result.map((r) => r.name)).toEqual(["live"]);
        const written = JSON.parse(await readFile(cachePath, "utf8"));
        expect(written.fetchedAt).toBe(NOW.toISOString());
        expect(written.repos.map((r: GitHubRepo) => r.name)).toEqual(["live"]);
    });

    it("fetches when cache file is missing", async () => {
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(f.calls).toHaveLength(1);
        expect(result.map((r) => r.name)).toEqual(["live"]);
    });

    it("treats corrupt cache JSON as missing and fetches", async () => {
        await writeCache(FRESH, []);
        await writeFile(cachePath, "{not json");
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(f.calls).toHaveLength(1);
        expect(result.map((r) => r.name)).toEqual(["live"]);
    });

    it("returns stale cache when fetch returns 403", async () => {
        await writeCache(STALE, [repo("cached")]);
        const f = stubFetch(() => new Response(JSON.stringify({ message: "API rate limit exceeded" }), { status: 403 }));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(result.map((r) => r.name)).toEqual(["cached"]);
    });

    it("returns stale cache when fetch rejects", async () => {
        await writeCache(STALE, [repo("cached")]);
        const f = stubFetch(() => { throw new TypeError("fetch failed"); });
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(result.map((r) => r.name)).toEqual(["cached"]);
    });

    it("returns [] when fetch fails and no cache exists", async () => {
        const f = stubFetch(() => { throw new TypeError("fetch failed"); });
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(result).toEqual([]);
    });

    it("returns [] when the response body is not an array", async () => {
        const f = stubFetch(() => new Response(JSON.stringify({ message: "weird" }), { status: 200 }));
        const result = await loadRepos({ cachePath, useCache: true, now: NOW, fetchImpl: f.impl });
        expect(result).toEqual([]);
    });

    it("sends Authorization header only when token is set", async () => {
        const without = stubFetch(okResponse([]));
        await loadRepos({ cachePath, useCache: false, now: NOW, fetchImpl: without.impl, token: "" });
        const withTok = stubFetch(okResponse([]));
        await loadRepos({ cachePath, useCache: false, now: NOW, fetchImpl: withTok.impl, token: "abc" });

        const h1 = new Headers(without.calls[0].init?.headers);
        const h2 = new Headers(withTok.calls[0].init?.headers);
        expect(without.calls[0].url).toBe("https://api.github.com/users/MirkoLouis/repos?per_page=100&sort=pushed");
        expect(h1.get("User-Agent")).toBe("mirkolouis-portfolio");
        expect(h1.get("Authorization")).toBeNull();
        expect(h2.get("Authorization")).toBe("Bearer abc");
    });

    it("skips cache read and write when useCache is false", async () => {
        await writeCache(FRESH, [repo("cached")]);
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({ cachePath, useCache: false, now: NOW, fetchImpl: f.impl });
        expect(f.calls).toHaveLength(1);
        expect(result.map((r) => r.name)).toEqual(["live"]);
        const onDisk = JSON.parse(await readFile(cachePath, "utf8"));
        expect(onDisk.fetchedAt).toBe(FRESH);
    });

    it("does not reject when the cache directory cannot be written", async () => {
        // A regular file used as a directory makes mkdir/writeFile fail
        const blocker = join(dir, "blocker");
        await writeFile(blocker, "x");
        const f = stubFetch(okResponse([repo("live")]));
        const result = await loadRepos({
            cachePath: join(blocker, "sub", "github-repos.json"),
            useCache: true,
            now: NOW,
            fetchImpl: f.impl,
        });
        expect(result.map((r) => r.name)).toEqual(["live"]);
    });
});
