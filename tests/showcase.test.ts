// Tests for the scrolling screenshot background: item building and column distribution
import type { ImageMetadata } from "astro";
import { describe, expect, it } from "vitest";
import { PLACEHOLDER_COLORS, buildShowcaseItems, distributeColumns, type ShowcaseItem } from "../src/lib/showcase";
import type { CuratedProject } from "../src/lib/types";

// Minimal stand-in for an imported image
function image(src: string): ImageMetadata {
    return { src, width: 100, height: 100, format: "png" } as ImageMetadata;
}

// Curated project fixture with the given screenshots
function project(screenshots: ImageMetadata[], objectPosition?: string): CuratedProject {
    return { slug: "p", title: "P", summary: "", stack: [], screenshots, visibility: "public", objectPosition };
}

// n distinct items labelled by index
function items(n: number): ShowcaseItem[] {
    return Array.from({ length: n }, (_, i) => ({ color: "#000", alt: `item-${i}` }));
}

describe("buildShowcaseItems", () => {
    it("returns 12 colour-cycling placeholders when there are no screenshots", () => {
        const result = buildShowcaseItems([project([])], []);
        expect(result).toHaveLength(12);
        expect(result.every((i) => i.image === undefined)).toBe(true);
        expect(result[0].color).toBe(PLACEHOLDER_COLORS[0]);
        expect(result[PLACEHOLDER_COLORS.length].color).toBe(PLACEHOLDER_COLORS[0]);
    });

    it("uses project screenshots first, then showcase screenshots", () => {
        const first = image("a.webp");
        const second = image("b.webp");
        const result = buildShowcaseItems([project([first])], [second]);
        expect(result.map((i) => i.image)).toEqual([first, second]);
    });

    it("carries a project's objectPosition to each of its screenshots", () => {
        const result = buildShowcaseItems([project([image("a.webp"), image("b.webp")], "top")], []);
        expect(result.map((i) => i.objectPosition)).toEqual(["top", "top"]);
    });

    it("leaves objectPosition unset for showcase screenshots", () => {
        const result = buildShowcaseItems([project([])], [image("b.webp")]);
        expect(result[0].objectPosition).toBeUndefined();
    });
});

describe("distributeColumns", () => {
    it("fills every column to the minimum by repeating when only 3 items exist", () => {
        const source = items(3);
        const columns = distributeColumns(source, 4, 4);
        expect(columns).toHaveLength(4);
        for (const column of columns) {
            expect(column.length).toBeGreaterThanOrEqual(4);
        }
        const seen = new Set(columns.flat().map((i) => i.alt));
        expect(seen).toEqual(new Set(source.map((i) => i.alt)));
    });

    it("deals items round-robin when there are enough", () => {
        const columns = distributeColumns(items(12), 4, 3);
        expect(columns.map((c) => c.length)).toEqual([3, 3, 3, 3]);
        expect(columns[0].map((i) => i.alt)).toEqual(["item-0", "item-4", "item-8"]);
    });
});
