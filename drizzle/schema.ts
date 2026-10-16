import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Google OAuth sub (openId) */
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
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  ticketOpenDate: timestamp("ticketOpenDate"),
  ticketLink: varchar("ticketLink", { length: 512 }),
  mapLink: varchar("mapLink", { length: 512 }),
  region: varchar("region", { length: 100 }),
  allowsCosplay: mysqlEnum("allowsCosplay", ["yes", "no", "limited"]).default("no").notNull(),
  createdBy: int("createdBy").notNull(),
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
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  notifyOneDayBefore: mysqlEnum("notifyOneDayBefore", ["email", "inapp", "both", "none"]).default("both").notNull(),
  notifyOneHourBefore: mysqlEnum("notifyOneHourBefore", ["email", "inapp", "both", "none"]).default("both").notNull(),
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
  subscriptionId: int("subscriptionId").notNull(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  notificationType: mysqlEnum("notificationType", ["email", "inapp", "push"]).notNull(),
  triggerType: mysqlEnum("triggerType", ["one_day_before", "one_hour_before"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Push subscriptions - stores Web Push subscription info per browser/user
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 512 }).notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Package applications - 코스프레 풀패키지/부분 서비스 수요 검증 사전 신청
 * 로그인 없이 제출 가능. contact=이메일 또는 휴대폰.
 * interests=관심 항목(JSON 배열: full/studio/photographer/costume/wig/makeup)
 */
export const packageApplications = mysqlTable("package_applications", {
  id: int("id").autoincrement().primaryKey(),
  contact: varchar("contact", { length: 320 }).notNull(),
  interests: text("interests").notNull(),
  character: varchar("character", { length: 255 }),
  timing: varchar("timing", { length: 255 }),
  budget: varchar("budget", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PackageApplication = typeof packageApplications.$inferSelect;
export type InsertPackageApplication = typeof packageApplications.$inferInsert;
