import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import * as db from "./db";

/**
 * Ingest API — lets the scheduled scraper push collected events into the DB.
 *
 * Mounted at /api/ingest in server/_core/index.ts (plain Express, not tRPC,
 * so the cron scraper can POST plain JSON without a tRPC client).
 *
 * Auth: `Authorization: Bearer <INGEST_API_KEY>`, compared timing-safe
 * against process.env.INGEST_API_KEY. Missing/mismatched key -> 401.
 */

// Mirrors the shape of events.create's input (server/routers.ts), but with
// location/ticketOpenDate optional (scrapers often don't have them) and
// ISO-string coercion since this endpoint receives plain JSON, not superjson.
// eventEndDate is accepted for forward-compat but not persisted (no column yet).
const ingestEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  eventDate: z.coerce.date(),
  eventEndDate: z.coerce.date().optional(),
  location: z.string().max(255).optional(),
  region: z.string().max(100).optional(),
  ticketOpenDate: z.coerce.date().optional(),
  ticketLink: z.string().url().max(512).optional().or(z.literal("")),
  mapLink: z.string().url().max(512).optional().or(z.literal("")),
  allowsCosplay: z.enum(["yes", "no", "limited"]).optional(),
});

const ingestBodySchema = z.object({
  events: z.array(ingestEventSchema).max(500),
});

function checkApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INGEST_API_KEY;
  const provided = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected || "");
  const ok = !!expected && a.length === b.length && timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: "unauthorized" });
  next();
}

// MySQL timestamps have second precision — normalize so the
// (name, eventDate) dedupe comparison matches what was stored.
function toSecondPrecision(d: Date): Date {
  const copy = new Date(d);
  copy.setMilliseconds(0);
  return copy;
}

export const ingestRouter = Router();

ingestRouter.post("/events", checkApiKey, async (req: Request, res: Response) => {
  const parsed = ingestBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body", details: parsed.error.flatten() });
  }

  let inserted = 0;
  let skipped = 0;

  for (const e of parsed.data.events) {
    const eventDate = toSecondPrecision(e.eventDate);
    try {
      const existing = await db.findEventByNameAndDate(e.name, eventDate);
      if (existing) {
        // 백필: 기존 행사에 ticketLink가 비어있고 새로 들어온 값이 있으면 채움.
        // (덮어쓰지 않고 빈 칸만 메움 — 스크래퍼가 링크를 못 가져오는 경우가 많아 수동 백필용)
        if (!existing.ticketLink && e.ticketLink) {
          await db.updateEvent(existing.id, { ticketLink: e.ticketLink });
        }
        skipped++;
        continue;
      }
      const created = await db.createEvent({
        name: e.name,
        description: e.description ?? null,
        eventDate,
        location: e.location?.trim() || "장소 미정",
        ticketOpenDate: e.ticketOpenDate ? toSecondPrecision(e.ticketOpenDate) : eventDate,
        ticketLink: e.ticketLink || null,
        mapLink: e.mapLink || null,
        region: e.region ?? null,
        allowsCosplay: e.allowsCosplay ?? "no",
        createdBy: 0, // system ingest — no user session
      });
      if (!created) throw new Error("createEvent returned null (DB unavailable?)");
      inserted++;
    } catch (err) {
      console.error("[Ingest] Failed to upsert event:", e.name, err);
      return res.status(500).json({ error: "ingest failed", inserted, skipped });
    }
  }

  return res.json({ inserted, skipped });
});

// DELETE /api/ingest/events — remove a single event by (name, eventDate).
// Used to clean up bad data from the scraper pipeline (e.g. test entries,
// mis-parsed events). Same Bearer key auth.
const deleteBodySchema = z.object({
  name: z.string().min(1),
  eventDate: z.coerce.date(),
});

ingestRouter.delete("/events", checkApiKey, async (req: Request, res: Response) => {
  const parsed = deleteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body", details: parsed.error.flatten() });
  }
  try {
    const existing = await db.findEventByNameAndDate(
      parsed.data.name,
      toSecondPrecision(parsed.data.eventDate)
    );
    if (!existing) {
      return res.status(404).json({ error: "not found" });
    }
    const ok = await db.deleteEvent(existing.id);
    if (!ok) throw new Error("deleteEvent returned false");
    return res.json({ deleted: 1, id: existing.id });
  } catch (err) {
    console.error("[Ingest] Failed to delete event:", parsed.data.name, err);
    return res.status(500).json({ error: "delete failed" });
  }
});
