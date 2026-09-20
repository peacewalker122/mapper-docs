import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://peacewalker122.github.io",
  base: "/mapper-docs/",
  integrations: [
    starlight({
      title: "Mapper",
      description: "Schema compiler and backend mapping runtime docs",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/peacewalker122/mapper" }],
      sidebar: [
        {
          label: "Getting started",
          items: ["guides/introduction", "guides/quickstart"],
        },
        {
          label: "Compiler",
          items: ["guides/compiler"],
        },
        {
          label: "Backend",
          items: ["guides/backend", "guides/http-contract", "guides/uploads"],
        },
        {
          label: "Frontend",
          items: ["guides/frontend"],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
