import { defineConfig, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import viteConfig from "./vite.config.ts";

// Runs each story (its `play` interactions + accessibility checks) as a test in
// a real browser via Playwright, so behaviour is exercised with real DOM/event
// semantics rather than jsdom.
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: ".storybook" })],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        // Headless Chromium hides scrollbars by default; the Bleed stories need a classic one.
        provider: playwright({
          launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
        }),
        headless: true,
        instances: [{ browser: "chromium" }],
      },
    },
  }),
);
