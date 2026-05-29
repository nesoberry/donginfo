import { eq, and, gte, lte, like, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, events, subscriptions, notifications, Event, InsertEvent, Subscription, InsertSubscription, Notification, InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Events Queries ============

export async function createEvent(data: InsertEvent): Promise<Event | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create event: database not available");
    return null;
  }

  try {
    const result = await db.insert(events).values(data);
    const eventId = result[0]?.insertId;
    if (!eventId) return null;

    const created = await db.select().from(events).where(eq(events.id, eventId as number)).limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create event:", error);
    throw error;
  }
}

export async function getEventById(id: number): Promise<Event | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get event: database not available");
    return null;
  }

  try {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get event:", error);
    throw error;
  }
}

export async function listEvents(filters?: {
  region?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list events: database not available");
    return [];
  }

  try {
    const conditions = [];

    // 기본값: 현재 시점에서 1년 후까지의 행사만 표시
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const startDate = filters?.startDate || now;
    const endDate = filters?.endDate || oneYearLater;

    if (filters?.region) {
      conditions.push(eq(events.region, filters.region));
    }
    if (filters?.search) {
      conditions.push(like(events.name, `%${filters.search}%`));
    }
    
    // 날짜 범위 필터 적용
    conditions.push(gte(events.eventDate, startDate));
    conditions.push(lte(events.eventDate, endDate));

    let query = db.select().from(events);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(asc(events.eventDate));
    return result;
  } catch (error) {
    console.error("[Database] Failed to list events:", error);
    return [];
  }
}

export async function updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update event: database not available");
    return null;
  }

  try {
    await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id));
    return getEventById(id);
  } catch (error) {
    console.error("[Database] Failed to update event:", error);
    throw error;
  }
}

export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete event: database not available");
    return false;
  }

  try {
    await db.delete(events).where(eq(events.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete event:", error);
    throw error;
  }
}

// ============ Subscription Queries ============

export async function createSubscription(data: InsertSubscription): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create subscription: database not available");
    return null;
  }

  try {
    const result = await db.insert(subscriptions).values(data);
    const subscriptionId = result[0]?.insertId;
    if (!subscriptionId) return null;

    const created = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId as number)).limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create subscription:", error);
    throw error;
  }
}

export async function getSubscription(userId: number, eventId: number): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.eventId, eventId)))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get subscription:", error);
    throw error;
  }
}

export async function getUserSubscriptions(userId: number): Promise<Subscription[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user subscriptions: database not available");
    return [];
  }

  try {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user subscriptions:", error);
    throw error;
  }
}

export async function deleteSubscription(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete subscription: database not available");
    return false;
  }

  try {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete subscription:", error);
    throw error;
  }
}

// ============ Notification Queries ============

export async function createNotification(data: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return null;
  }

  try {
    const result = await db.insert(notifications).values(data);
    const notificationId = result[0]?.insertId;
    if (!notificationId) return null;

    const created = await db.select().from(notifications).where(eq(notifications.id, notificationId as number)).limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}

export async function getUserNotifications(userId: number, limit = 20): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user notifications: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user notifications:", error);
    throw error;
  }
}

export async function getPendingNotifications(): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get pending notifications: database not available");
    return [];
  }

  try {
    const result = await db.select().from(notifications).where(eq(notifications.status, "pending"));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get pending notifications:", error);
    throw error;
  }
}

export async function updateNotificationStatus(id: number, status: "sent" | "failed", failureReason?: string): Promise<Notification | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update notification: database not available");
    return null;
  }

  try {
    await db
      .update(notifications)
      .set({
        status,
        sentAt: status === "sent" ? new Date() : undefined,
        failureReason: failureReason || null,
      })
      .where(eq(notifications.id, id));

    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to update notification:", error);
    throw error;
  }
}
