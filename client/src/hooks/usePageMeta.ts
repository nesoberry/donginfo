import { useEffect } from "react";

/**
 * usePageMeta — sets document title, meta description, OG tags and canonical
 * link per page. The site is a client-rendered SPA, so crawlers that execute
 * JS (Google) pick these up; the static index.html carries the default set.
 */
export function usePageMeta(opts: {
  title: string;
  description?: string;
  canonical?: string;
}) {
  const { title, description, canonical } = opts;

  useEffect(() => {
    document.title = title;

    const setMeta = (attrName: "name" | "property", attrValue: string, content: string) => {
      const selector = `meta[${attrName}="${attrValue}"]`;
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
    setMeta("property", "og:title", title);
    setMeta("name", "twitter:title", title);

    let link = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute(
      "href",
      canonical ?? window.location.href.split("?")[0].split("#")[0]
    );
  }, [title, description, canonical]);
}
