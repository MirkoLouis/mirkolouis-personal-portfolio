// Astro configuration: fully static output, deployed to Vercel as plain files
import { defineConfig } from "astro/config";

export default defineConfig({
    // Static site generation; no SSR adapter needed
    output: "static",
});
