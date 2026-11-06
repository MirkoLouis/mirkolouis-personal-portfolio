// Tests for relative dates and the repo-list collapse rule
import { describe, expect, it } from "vitest";
import { COLLAPSED_ROWS, formatRelative, shouldCollapse } from "../src/lib/format";

const NOW = new Date("2026-11-01T12:00:00Z");

// ISO timestamp `days` days before NOW
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("formatRelative", () => {
    it.each([
        [0, "today"],
        [1, "1 day ago"],
        [29, "29 days ago"],
        [30, "1 month ago"],
        [335, "11 months ago"],
        [365, "1 year ago"],
        [800, "2 years ago"],
    ])("%i days → %s", (days, expected) => {
        expect(formatRelative(daysAgo(days), NOW)).toBe(expected);
    });
});

describe("shouldCollapse", () => {
    it.each([
        [0, false],
        [4, false],
        [5, true],
        [10, true],
    ])("%i repos → %s", (count, expected) => {
        expect(shouldCollapse(count)).toBe(expected);
    });

    it("collapses to 4 rows", () => {
        expect(COLLAPSED_ROWS).toBe(4);
    });
});
