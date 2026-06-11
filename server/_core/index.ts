import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cron from "node-cron";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  sendTicketOpenNotificationHandler,
  processNotificationsHandler,
  runTicketOpenNotification,
  runProcessNotifications,
} from "../scheduled";
import { authRouter } from './authRouter';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const rawOrigins = process.env.ALLOWED_ORIGINS || "https://www.donginfo.com,https://donginfo.com";
  const allowedOrigins = rawOrigins.split(",").map(o => o.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Scheduled tasks
  app.post("/api/scheduled/ticket-open-notification", sendTicketOpenNotificationHandler);
  app.post("/api/scheduled/process-notifications", processNotificationsHandler);
  app.use('/api/auth', authRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 🕐 내부 크론 스케줄러 (Railway 자동 실행 — 수동 명령어 불필요)
  //   - 매 정시(KST 기준): 예매 오픈 1시간 전 알림 대상 탐색
  //   - 매 정시 +5분:      대기 중인 알림 실제 발송
  // ─────────────────────────────────────────────────────────────────────────
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] ticket-open-notification 실행");
    try {
      const result = await runTicketOpenNotification();
      console.log("[Cron] ticket-open-notification 완료:", result);
    } catch (err) {
      console.error("[Cron] ticket-open-notification 에러:", err);
    }
  });

  cron.schedule("5 * * * *", async () => {
    console.log("[Cron] process-notifications 실행");
    try {
      const result = await runProcessNotifications();
      console.log("[Cron] process-notifications 완료:", result);
    } catch (err) {
      console.error("[Cron] process-notifications 에러:", err);
    }
  });

  console.log("[Cron] 스케줄러 등록 완료 — 매 정시 알림 탐색, 매 정시 +5분 알림 발송");
}

startServer().catch(console.error);
