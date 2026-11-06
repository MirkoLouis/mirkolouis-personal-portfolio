// Shared data types for GitHub repos and curated projects
import type { ImageMetadata } from "astro";

// Subset of the GitHub REST "repository" object that the site uses
export interface GitHubRepo {
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    pushed_at: string;
    fork: boolean;
    archived: boolean;
}

// Who can see the project's source
export type Visibility = "public" | "private" | "client";

// A hand-written project entry from src/data/projects.ts
export interface CuratedProject {
    slug: string;
    title: string;
    summary: string;
    stack: string[];
    screenshots: ImageMetadata[];
    // CSS object-position for this project's screenshots when cropped, e.g. "top" (default: center)
    objectPosition?: string;
    visibility: Visibility;
    repo?: string;
    demo?: string;
}

// A curated entry with live GitHub stats merged in at build time
export interface FeaturedProject extends CuratedProject {
    github?: {
        stars: number;
        pushedAt: string;
        language: string | null;
        url: string;
    };
}
