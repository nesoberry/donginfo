import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { events, subscriptions, notifications, users } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import nodemailer from "nodemailer";

// 📧 메일 발송기 세팅
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function processNotificationsHandler(req: Request, res: Response) {
  try {
    // 🔒 1. 크론 로봇만 접근 가능하도록 자물쇠 원상복구
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

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
          // 🔒 2. 치트키 빼고, 진짜 알림 신청한 유저의 메일로 보내도록 복구
          const targetUser = await db.select().from(users).where(eq(users.id, notification.userId)).limit(1);
          const emailAddress = targetUser[0]?.email;

          if (emailAddress) {
            await transporter.sendMail({
              from: `"동인행사 알리미" <${process.env.EMAIL_USER}>`,
              to: emailAddress,
              subject: notification.title || "동인행사 알리미 알림",
              text: notification.message || "행사 알림이 도착했습니다.",
              html: `<h3>${notification.title || '동인행사 알리미'}</h3><p>${notification.message || '알림이 도착했습니다.'}</p>`,
            });
            console.log(`[Email] ${emailAddress}로 메일 발송 성공!`);
          }
        }

        await db
          .update(notifications)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(notifications.id, notification.id));

        successCount++;
      } catch (error) {
        failureCount++;
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
    // 🔒 1. 크론 로봇 자물쇠 원상복구
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database connection failed" });

    const now = new Date();

    // 🎯 타이밍 1: 1시간 전
    const oneHourBeforeStart = new Date(now.getTime() + 55 * 60 * 1000);
    const oneHourBeforeEnd = new Date(now.getTime() + 65 * 60 * 1000);
    
    const eventsOneHourBefore = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.ticketOpenDate, oneHourBeforeStart),
          lte(events.ticketOpenDate, oneHourBeforeEnd)
        )
      );

    // 🔒 3. 치트키 빼고, 진짜 '구독(알림 신청)'한 사람만 찾아서 장전하도록 복구
    for (const event of eventsOneHourBefore) {
      const eventSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.eventId, event.id),
            ne(subscriptions.notifyOneHourBefore, "none")
          )
        );

      for (const subscription of eventSubscriptions) {
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
      }
    }

    // 🎯 타이밍 2: 1일 전 (오후 6시) 원상복구
    const kstHour = (now.getUTCHours() + 9) % 24;
    if (kstHour === 18) {
      const tomorrowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

      const eventsTomorrow = await db
        .select()
        .from(events)
        .where(
          and(
            gte(events.eventDate, tomorrowStart),
            lte(events.eventDate, tomorrowEnd)
          )
        );

      for (const event of eventsTomorrow) {
        const eventSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.eventId, event.id),
              ne(subscriptions.notifyOneDayBefore, "none")
            )
          );

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
        }
      }
    }

    return res.status(200).json({ success: true, message: "알림 타겟팅 완료!" });
    
  } catch (err) {
    console.error("알림 생성 중 에러:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}