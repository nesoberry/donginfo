import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table - stores doujin event information
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // 행사명
  description: text("description"), // 행사 설명
  eventDate: timestamp("eventDate").notNull(), // 행사 날짜 (ISO 8601)
  location: varchar("location", { length: 255 }).notNull(), // 장소
  ticketOpenDate: timestamp("ticketOpenDate").notNull(), // 예매 오픈 일시
  ticketLink: varchar("ticketLink", { length: 512 }), // 예매처 링크
  mapLink: varchar("mapLink", { length: 512 }), // 배치도 링크
  region: varchar("region", { length: 100 }), // 지역 (서울, 부산 등)
  createdBy: int("createdBy").notNull(), // 생성자 (admin user id)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Subscriptions table - stores user subscriptions to event notifications
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 구독 사용자
  eventId: int("eventId").notNull(), // 구독 행사
  notifyOneDayBefore: mysqlEnum("notifyOneDayBefore", ["email", "inapp", "both", "none"]).default("both").notNull(), // D-1 알림 방식
  notifyOneHourBefore: mysqlEnum("notifyOneHourBefore", ["email", "inapp", "both", "none"]).default("both").notNull(), // 1시간 전 알림 방식
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Notifications table - stores sent notifications log
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(), // 구독 ID
  eventId: int("eventId").notNull(), // 행사 ID
  userId: int("userId").notNull(), // 수신자
  notificationType: mysqlEnum("notificationType", ["email", "inapp"]).notNull(), // 알림 타입
  triggerType: mysqlEnum("triggerType", ["one_day_before", "one_hour_before"]).notNull(), // 트리거 타입
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(), // 발송 상태
  sentAt: timestamp("sentAt"), // 실제 발송 시간
  failureReason: text("failureReason"), // 실패 사유
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;