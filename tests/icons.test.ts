// Tests for the Nerd Font icon map and glyph() helper
import { describe, expect, it } from "vitest";
import icons from "../src/lib/icons.json";
import { glyph } from "../src/lib/icons";

describe("glyph", () => {
    it("returns the PUA character for an icon name", () => {
        expect(glyph("php")).toBe(String.fromCodePoint(0xe73d));
    });
});

describe("icons.json", () => {
    it("stores every codepoint as 4-5 lowercase hex digits", () => {
        for (const code of Object.values(icons)) {
            expect(code).toMatch(/^[0-9a-f]{4,5}$/);
        }
    });
});
