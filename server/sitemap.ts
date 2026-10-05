import { Router, Request, Response } from "express";
import { listEvents } from "./db";

/**
 * Sitemap — lets search engines discover event pages.
 *
 * Served at https://www.donginfo.com/sitemap.xml via a Vercel rewrite
 * (see vercel.json) that proxies to this backend route, so the sitemap
 * always reflects the current DB without a frontend rebuild.
 */

const SITE_URL = "https://www.donginfo.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: "daily" | "weekly";
  priority: string;
}

export const sitemapRouter = Router();

sitemapRouter.get("/sitemap.xml", async (_req: Request, res: Response) => {
  const urls: SitemapUrl[] = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/calendar`, changefreq: "daily", priority: "0.8" },
  ];

  try {
    const events = await listEvents();
    for (const e of events) {
      const lastmod = e.updatedAt
        ? new Date(e.updatedAt).toISOString().slice(0, 10)
        : undefined;
      urls.push({
        loc: `${SITE_URL}/event/${e.id}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  } catch (err) {
    console.error("[Sitemap] Failed to list events:", err);
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
          `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>`;

  res.header("Content-Type", "application/xml; charset=utf-8").send(body);
});
