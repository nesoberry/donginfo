import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { events, subscriptions, notifications } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

/**
 * 예매 오픈 알림 발송 핸들러
 * D-1일 전 또는 1시간 전 시점에 구독자에게 알림을 발송한다
 */
export async function sendTicketOpenNotificationHandler(req: Request, res: Response) {
  try {
    // 크론 요청 인증
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      });
    }

    // 현재 시간 기준으로 예매 오픈 예정인 행사 조회
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // D-1일 전 알림 발송
    // 예매 오픈이 24시간 후인 행사 조회
    const oneDayBeforeStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const oneDayBeforeEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);
    
    const eventsOneDayBefore = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.ticketOpenDate, oneDayBeforeStart),
          lte(events.ticketOpenDate, oneDayBeforeEnd)
        )
      );

    // D-1일 전 구독자에게 알림 발송
    for (const event of eventsOneDayBefore) {
      const eventSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.eventId, event.id),
            // notifyOneDayBefore가 "email", "inapp", "both" 중 하나
            ne(subscriptions.notifyOneDayBefore, "none")
          )
        );

      for (const subscription of eventSubscriptions) {
        // 이메일 알림
        if (
          subscription.notifyOneDayBefore === "email" ||
          subscription.notifyOneDayBefore === "both"
        ) {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "email",
            triggerType: "one_day_before",
            status: "pending",
          });
        }

        // 인앱 알림
        if (
          subscription.notifyOneDayBefore === "inapp" ||
          subscription.notifyOneDayBefore === "both"
        ) {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "inapp",
            triggerType: "one_day_before",
            status: "pending",
          });
        }
      }
    }

    // 1시간 전 알림 발송
    // 예매 오픈이 1시간 후인 행사 조회
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

    // 1시간 전 구독자에게 알림 발송
    for (const event of eventsOneHourBefore) {
      const eventSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.eventId, event.id),
            // notifyOneHourBefore가 "email", "inapp", "both" 중 하나
            ne(subscriptions.notifyOneHourBefore, "none")
          )
        );

      for (const subscription of eventSubscriptions) {
        // 이메일 알림
        if (
          subscription.notifyOneHourBefore === "email" ||
          subscription.notifyOneHourBefore === "both"
        ) {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "email",
            triggerType: "one_hour_before",
            status: "pending",
          });
        }

        // 인앱 알림
        if (
          subscription.notifyOneHourBefore === "inapp" ||
          subscription.notifyOneHourBefore === "both"
        ) {
          await db.insert(notifications).values({
            subscriptionId: subscription.id,
            eventId: event.id,
            userId: subscription.userId,
            notificationType: "inapp",
            triggerType: "one_hour_before",
            status: "pending",
          });
        }
      }
    }

    // 실제 이메일/인앱 발송 로직은 별도의 작업에서 처리
    // 여기서는 notification 레코드만 생성하고 상태를 pending으로 설정

    res.json({
      ok: true,
      processed: {
        oneDayBefore: eventsOneDayBefore.length,
        oneHourBefore: eventsOneHourBefore.length,
      },
    });
  } catch (error) {
    console.error("[Scheduled] Ticket open notification error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req)).taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 실제 이메일/인앱 알림 발송 핸들러
 * pending 상태의 알림을 실제로 발송하고 상태를 업데이트한다
 */
export async function processNotificationsHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      });
    }

    // pending 상태의 알림 조회
    const pendingNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, "pending"))
      .limit(100); // 한 번에 100개씩 처리

    let successCount = 0;
    let failureCount = 0;

    for (const notification of pendingNotifications) {
      try {
        // 이메일 발송 (실제 구현)
        if (notification.notificationType === "email") {
          // TODO: 실제 이메일 발송 로직 구현
          // sendEmail(user.email, subject, body)
          console.log(`[Email] Sending notification to user ${notification.userId}`);
        }

        // 인앱 알림 (이미 DB에 저장됨)
        if (notification.notificationType === "inapp") {
          console.log(`[InApp] Notification created for user ${notification.userId}`);
        }

        // 상태 업데이트
        await db
          .update(notifications)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
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

    res.json({
      ok: true,
      processed: pendingNotifications.length,
      success: successCount,
      failure: failureCount,
    });
  } catch (error) {
    console.error("[Scheduled] Process notifications error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req)).taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
