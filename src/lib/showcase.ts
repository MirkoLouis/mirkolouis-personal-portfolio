// Scrolling screenshot background: turn screenshots (or placeholders) into scrolling columns
import type { ImageMetadata } from "astro";
import type { CuratedProject } from "./types";

// One tile in the scrolling screenshot background: a real image, or a solid placeholder colour
export interface ShowcaseItem {
    image?: ImageMetadata;
    objectPosition?: string;
    color: string;
    alt: string;
}

// Light tints used until real screenshots exist
export const PLACEHOLDER_COLORS: string[] = [
    "rgb(0 167 225 / 0.35)",
    "#DCE3E8",
    "rgb(0 167 225 / 0.18)",
    "#F4F7F9",
    "rgb(0 119 163 / 0.25)",
    "#E8EEF2",
];

// All project screenshots followed by background-only ones; placeholders when there are none
export function buildShowcaseItems(
    projects: CuratedProject[],
    extra: ImageMetadata[],
    placeholderCount = 12,
): ShowcaseItem[] {
    // Collect real screenshots in curated order
    const projectItems = projects.flatMap((project) =>
        project.screenshots.map((image) => ({ image, objectPosition: project.objectPosition })));
    const sources: Pick<ShowcaseItem, "image" | "objectPosition">[] = [
        ...projectItems,
        ...extra.map((image) => ({ image })),
    ];
    if (sources.length > 0) {
        return sources.map((source) => ({ ...source, color: "var(--surface)", alt: "" }));
    }

    // No screenshots yet: cycle through the placeholder palette
    return Array.from({ length: placeholderCount }, (_, i) => ({
        color: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
        alt: "",
    }));
}

// Deal items round-robin into columns, then repeat each column's items up to minPerColumn
export function distributeColumns(
    items: ShowcaseItem[],
    columnCount: number,
    minPerColumn: number,
): ShowcaseItem[][] {
    const columns: ShowcaseItem[][] = Array.from({ length: columnCount }, () => []);
    // Nothing to show: empty columns
    if (items.length === 0) {
        return columns;
    }

    // Too few items for one per column: cycle the list so no column starts empty
    const source = items.length >= columnCount
        ? items
        : Array.from({ length: columnCount }, (_, i) => items[i % items.length]);

    // Round-robin deal
    source.forEach((item, i) => {
        columns[i % columnCount].push(item);
    });

    // Repeat each column's own items until it is tall enough to loop seamlessly
    return columns.map((column) => {
        const filled = [...column];
        while (filled.length < minPerColumn) {
            filled.push(column[filled.length % column.length]);
        }
        return filled;
    });
}
