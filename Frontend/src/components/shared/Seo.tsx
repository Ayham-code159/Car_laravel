import { useEffect } from "react";
import { site } from "../../lib/config/site";

export function Seo({
  title,
  description,
  path,
  image,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} | ${site.name}`;
    const meta = (key: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.append(el);
      }
      el.content = content;
    };
    meta("description", description);
    meta("og:title", `${title} | ${site.name}`, true);
    meta("og:description", description, true);
    meta("robots", noindex ? "noindex,follow" : "index,follow");
    const imageUrl =
      image || (site.url ? `${site.url}/images/hero-desktop.webp` : "");
    if (imageUrl) meta("og:image", imageUrl, true);
    else document.head.querySelector('meta[property="og:image"]')?.remove();
    if (site.url) {
      let el = document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.append(el);
      }
      el.href = `${site.url}${path}`;
      meta("og:url", el.href, true);
    }
  }, [title, description, path, image, noindex]);
  return null;
}
