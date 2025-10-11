// @ts-check
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mparsonsauthor.com",
  integrations: [
    tailwind({
      configFile: "./tailwind.config.cjs",
    }),
  ],
  output: "static",
  prefetch: {
    defaultStrategy: "viewport",
  },
});
