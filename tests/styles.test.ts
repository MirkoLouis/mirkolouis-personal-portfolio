// Guards global CSS rules that other components depend on
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync("src/styles/global.css", "utf8");

describe("global img rule", () => {
    // Astro's <Image> emits a height attribute, which acts as a CSS height and would
    // otherwise defeat every aspect-ratio frame (project cards, background tiles, portrait)
    it("sets height: auto so aspect-ratio wins over the height attribute", () => {
        const rule = globalCss.match(/^img\s*\{([^}]*)\}/m);
        expect(rule?.[1]).toMatch(/height:\s*auto/);
    });
});
