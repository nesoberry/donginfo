import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ Events Router ============
  events: router({
    list: publicProcedure
      .input(
        z.object({
          region: z.string().optional(),
          search: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => db.listEvents(input)),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.id);
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        return event;
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          eventDate: z.date(),
          location: z.string().min(1),
          // 미정이면 생략 가능 — DB NOT NULL이라 eventDate로 채우지만
          // ticketLink 없이는 화면에 표시되지 않는 inert 값임
          ticketOpenDate: z.date().optional(),
          ticketLink: z.string().url().optional(),
          mapLink: z.string().url().optional(),
          region: z.string().optional(),
          allowsCosplay: z.enum(["yes", "no", "limited"]).default("no").optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const event = await db.createEvent({
          ...input,
          ticketOpenDate: input.ticketOpenDate ?? input.eventDate,
          createdBy: ctx.user.id });
        if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create event" });
        return event;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          eventDate: z.date().optional(),
          location: z.string().min(1).optional(),
          ticketOpenDate: z.date().optional(),
          ticketLink: z.string().url().optional(),
          mapLink: z.string().url().optional(),
          region: z.string().optional(),
          allowsCosplay: z.enum(["yes", "no", "limited"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const event = await db.updateEvent(id, data);
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        return event;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteEvent(input.id);
        if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        return { success: true };
      }),
  }),

  // ============ Subscriptions Router ============
  subscriptions: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getUserSubscriptions(ctx.user.id)),

    getByEventId: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => db.getSubscription(ctx.user.id, input.eventId)),

    create: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          notifyOneDayBefore: z.enum(["email", "inapp", "both", "none"]).default("both"),
          notifyOneHourBefore: z.enum(["email", "inapp", "both", "none"]).default("both"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getSubscription(ctx.user.id, input.eventId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already subscribed to this event" });
        const subscription = await db.createSubscription({ userId: ctx.user.id, ...input });
        if (!subscription) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subscription" });
        return subscription;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          notifyOneDayBefore: z.enum(["email", "inapp", "both", "none"]).optional(),
          notifyOneHourBefore: z.enum(["email", "inapp", "both", "none"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userSubs = await db.getUserSubscriptions(ctx.user.id);
        if (!userSubs.some(sub => sub.id === input.id))
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        const { id, ...data } = input;
        const subscription = await db.updateSubscription(id, data);
        if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
        return subscription;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userSubs = await db.getUserSubscriptions(ctx.user.id);
        if (!userSubs.some(sub => sub.id === input.id))
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        const success = await db.deleteSubscription(input.id);
        if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
        return { success: true };
      }),
  }),

  // ============ Notifications Router ============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => db.getUserNotifications(ctx.user.id, input.limit)),
  }),

  // ============ Push Notifications Router ============
  push: router({
    /** VAPID 공개키 반환 (클라이언트가 구독 요청 시 필요) */
    getPublicKey: publicProcedure.query(() => ({
      publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    })),

    /** 브라우저 푸시 구독 저장 */
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string().url(),
          p256dh: z.string(),
          auth: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.savePushSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
        return { success: true };
      }),

    /** 브라우저 푸시 구독 해제 */
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        await db.deletePushSubscription(input.endpoint);
        return { success: true };
      }),

    /** 현재 사용자의 푸시 구독 상태 조회 */
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const subs = await db.getPushSubscriptionsByUserId(ctx.user.id);
      return { isSubscribed: subs.length > 0 };
    }),
  }),
});

export type AppRouter = typeof appRouter;
