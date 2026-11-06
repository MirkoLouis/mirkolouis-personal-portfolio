// Vitest configuration: unit tests live under tests/
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
    },
});
