import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Resolve dist/public path robustly: try import.meta.dirname first,
  // fall back to process.cwd() if the directory doesn't exist.
  const candidatePaths = [
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
  ];
  const distPath = candidatePaths.find(p => fs.existsSync(p)) ?? candidatePaths[0];

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    console.log(`[Static] Serving frontend from: ${distPath}`);
  }

  const indexPath = path.resolve(distPath, "index.html");

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for all unmatched routes (client-side routing)
  // Note: app.use without a path arg is the reliable catch-all in Express 4
  app.use((_req, res) => {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`[Static] Failed to serve index.html from ${indexPath}:`, err);
        res.status(500).send("Server configuration error: frontend build not found.");
      }
    });
  });
}
