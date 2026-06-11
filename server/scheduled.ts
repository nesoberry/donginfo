import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { events, subscriptions, notifications, users, pushSubscriptions } from "../drizzle/schema";
import nodemailer from "nodemailer";
import webpush from "web-push";

// 📧 메일 발송기 세팅
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔔 Web Push VAPID 세팅
if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

function verifyCronAuth(req: Request, res: Response): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET 환경변수가 설정되지 않았습니다.");
    res.status(500).json({ error: "server-misconfigured" });
    return false;
  }
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    res.status(403).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

export async function processNotificationsHandler(req: Request, res: Response) {
  try {
    if (!verifyCronAuth(req, res)) return;

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database connection failed" });

    const pendingNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, "pending"))
      .limit(100);

    let successCount = 0;
    let failureCount = 0;

    for (const notification of pendingNotifications) {
      try {
        if (notification.notificationType === "email") {
          // ✉️ 이메일 발송
          const targetUser = await db.select().from(users).where(eq(users.id, notification.userId)).limit(1);
          const emailAddress = targetUser[0]?.email;

          if (emailAddress) {
            const event = await db.select().from(events).where(eq(events.id, notification.eventId)).limit(1);
            const eventName = event[0]?.name ?? "동인행사";
            const triggerLabel = notification.triggerType === "one_day_before" ? "내일" : "1시간 후";

            await transporter.sendMail({
              from: `"동인행사 알리미" <${process.env.EMAIL_USER}>`,
              to: emailAddress,
              subject: `[동인행사 알리미] ${eventName} 예매 ${triggerLabel} 오픈!`,
              text: `${eventName} 행사 예매가 ${triggerLabel} 오픈됩니다. 잊지 마세요!`,
              html: `<h3>🎉 ${eventName}</h3><p>예매 오픈이 <strong>${triggerLabel}</strong>입니다. 놓치지 마세요!</p>`,
            });
            console.log(`[Email] ${emailAddress}로 메일 발송 성공!`);
          }
        } else if (notification.notificationType === "push") {
          // 🔔 브라우저 푸시 발송
          const event = await db.select().from(events).where(eq(events.id, notification.eventId)).limit(1);
          const eventName = event[0]?.name ?? "동인행사";
          const triggerLabel = notification.triggerType === "one_day_before" ? "내일" : "1시간 후";

          const userPushSubs = await db
            .select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, notification.userId));

          for (const sub of userPushSubs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({
                  title: `${eventName} 예매 ${triggerLabel} 오픈!`,
                  body: `${eventName} 예매 오픈이 ${triggerLabel}입니다. 놓치지 마세요!`,
                  url: "/",
                })
              );
              console.log(`[Push] userId ${notification.userId}에게 푸시 발송 성공!`);
            } catch (pushError: any) {
              // 410/404 = 구독 만료 → DB에서 삭제
              if (pushError?.statusCode === 410 || pushError?.statusCode === 404) {
                await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
                console.log(`[Push] 만료된 구독 삭제: ${sub.endpoint}`);
              } else {
                throw pushError;
              }
            }
          }
        }
        // inapp 타입은 더 이상 생성하지 않으므로 별도 처리 없음

        await db
          .update(notifications)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(notifications.id, notification.id));

        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`[Notification] id=${notification.id} type=${notification.notificationType} 발송 실패:`, error);
        await db
          .update(notifications)
          .set({
            status: "failed",
            failureReason: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(notifications.id, notification.id));
      }
    }

    return res.status(200).json({ success: true, processed: successCount, failed: failureCount });
  } catch (err) {
    console.error("알림 처리 중 에러:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function sendTicketOpenNotificationHandler(req: Request, res: Response) {
  try {
    if (!verifyCronAuth(req, res)) return;

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database connection failed" });

    const now = new Date();

    // 🎯 타이밍 1: 예매 오픈 1시간 전
    const oneHourBeforeStart = new Date(now.getTime() + 55 * 60 * 1000);
    const oneHourBeforeEnd = new Date(now.getTime() + 65 * 60 * 1000);

    const eventsOneHourBefore = await db
      .select()
      .from(events)
      .where(and(gte(events.ticketOpenDate, oneHourBeforeStart), lte(events.ticketOpenDate, oneHourBeforeEnd)));

    for (const event of eventsOneHourBefore) {
      const eventSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.eventId, event.id), ne(subscriptions.notifyOneHourBefore, "none")));

      for (const subscription of eventSubscriptions) {
        // 이메일 알림 생성
        if (subscription.notifyOneHourBefore === "email" || subscription.notifyOneHourBefore === "both") {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "email",
            triggerType: "one_hour_before",
            status: "pending",
          });
        }

        // 브라우저 푸시 알림 생성 (push_subscriptions에 등록된 사용자에게만)
        const hasPushSub = await db
          .select({ id: pushSubscriptions.id })
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, subscription.userId))
          .limit(1);

        if (hasPushSub.length > 0) {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "push",
            triggerType: "one_hour_before",
            status: "pending",
          });
        }
      }
    }

    // 🎯 타이밍 2: 행사 D-1 (매일 KST 18:00 실행 가정)
    const kstHour = (now.getUTCHours() + 9) % 24;
    if (kstHour === 18) {
      const tomorrowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

      const eventsTomorrow = await db
        .select()
        .from(events)
        .where(and(gte(events.eventDate, tomorrowStart), lte(events.eventDate, tomorrowEnd)));

      for (const event of eventsTomorrow) {
        const eventSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(and(eq(subscriptions.eventId, event.id), ne(subscriptions.notifyOneDayBefore, "none")));

        for (const subscription of eventSubscriptions) {
          if (subscription.notifyOneDayBefore === "email" || subscription.notifyOneDayBefore === "both") {
            await db.insert(notifications).values({
              subscriptionId: subscription.id,
              eventId: event.id,
              userId: subscription.userId,
              notificationType: "email",
              triggerType: "one_day_before",
              status: "pending",
            });
          }

          // 브라우저 푸시 알림 생성
          const hasPushSub = await db
            .select({ id: pushSubscriptions.id })
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, subscription.userId))
            .limit(1);

          if (hasPushSub.length > 0) {
            await db.insert(notifications).values({
              subscriptionId: subscription.id,
              eventId: event.id,
              userId: subscription.userId,
              notificationType: "push",
              triggerType: "one_day_before",
              status: "pending",
            });
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: "알림 타겟팅 완료!" });
  } catch (err) {
    console.error("알림 생성 중 에러:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
