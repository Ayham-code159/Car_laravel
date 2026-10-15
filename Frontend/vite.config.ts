import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const name = env.VITE_BUSINESS_NAME?.trim() || "THE COLLECTION";
  const escapeHtml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]!,
    );
  let origin = "";
  try {
    const url = new URL(env.VITE_SITE_URL);
    if (["https:", "http:"].includes(url.protocol)) origin = url.origin;
  } catch {
    /* A production origin is optional in development. */
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "public-site-metadata",
        transformIndexHtml(html) {
          const title = escapeHtml(`Drive beyond ordinary | ${name}`);
          return {
            html: html
              .replace(/<title>.*?<\/title>/, () => `<title>${title}</title>`)
              .replace(
                /(<meta property="og:title" content=")[^"]*/,
                (_match, prefix: string) => `${prefix}${title}`,
              ),
            tags: origin
              ? [
                  {
                    tag: "link",
                    attrs: { rel: "canonical", href: `${origin}/` },
                    injectTo: "head" as const,
                  },
                  {
                    tag: "meta",
                    attrs: {
                      property: "og:image",
                      content: `${origin}/images/hero-desktop.webp`,
                    },
                    injectTo: "head" as const,
                  },
                  {
                    tag: "meta",
                    attrs: { property: "og:url", content: `${origin}/` },
                    injectTo: "head" as const,
                  },
                ]
              : [],
          };
        },
      },
    ],
    test: { include: ["tests/**/*.test.ts"], environment: "node" },
    build: { chunkSizeWarningLimit: 550 },
  };
});
