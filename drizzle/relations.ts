import { relations } from "drizzle-orm";
import { users, events, subscriptions, notifications } from "./schema";

// 사용자 → 구독 목록 (한 사용자가 여러 행사를 구독할 수 있음)
// 사용자 → 알림 목록 (한 사용자가 여러 알림을 받을 수 있음)
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  notifications: many(notifications),
}));

// 행사 → 구독 목록 (한 행사에 여러 사람이 구독할 수 있음)
// 행사 → 알림 목록 (한 행사에서 여러 알림이 발송될 수 있음)
export const eventsRelations = relations(events, ({ many }) => ({
  subscriptions: many(subscriptions),
  notifications: many(notifications),
}));

// 구독 → 사용자 (이 구독이 누구의 것인지)
// 구독 → 행사 (이 구독이 어떤 행사에 대한 것인지)
// 구독 → 알림 목록 (이 구독에서 발송된 알림들)
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [subscriptions.eventId],
    references: [events.id],
  }),
  notifications: many(notifications),
}));

// 알림 → 구독 (어떤 구독에서 발생한 알림인지)
// 알림 → 사용자 (누구에게 보낸 알림인지)
// 알림 → 행사 (어떤 행사에 대한 알림인지)
export const notificationsRelations = relations(notifications, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [notifications.subscriptionId],
    references: [subscriptions.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}));
