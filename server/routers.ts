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
      return {
        success: true,
      } as const;
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
      .query(async ({ input }) => {
        return db.listEvents(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        return event;
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          eventDate: z.date(),
          location: z.string().min(1),
          ticketOpenDate: z.date(),
          ticketLink: z.string().url().optional(),
          mapLink: z.string().url().optional(),
          region: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const event = await db.createEvent({
          ...input,
          createdBy: ctx.user.id,
        });
        if (!event) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create event" });
        }
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const event = await db.updateEvent(id, data);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        return event;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteEvent(input.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        return { success: true };
      }),
  }),

  // ============ Subscriptions Router ============
  subscriptions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscriptions(ctx.user.id);
    }),

    getByEventId: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getSubscription(ctx.user.id, input.eventId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          notifyOneDayBefore: z.enum(["email", "inapp", "both", "none"]).default("both"),
          notifyOneHourBefore: z.enum(["email", "inapp", "both", "none"]).default("both"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if subscription already exists
        const existing = await db.getSubscription(ctx.user.id, input.eventId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Already subscribed to this event" });
        }

        const subscription = await db.createSubscription({
          userId: ctx.user.id,
          eventId: input.eventId,
          notifyOneDayBefore: input.notifyOneDayBefore,
          notifyOneHourBefore: input.notifyOneHourBefore,
        });
        if (!subscription) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subscription" });
        }
        return subscription;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verify ownership by checking if subscription belongs to user
        const subscriptions = await db.getUserSubscriptions(ctx.user.id);
        const isOwner = subscriptions.some(sub => sub.id === input.id);
        if (!isOwner) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const success = await db.deleteSubscription(input.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
        }
        return { success: true };
      }),
  }),

  // ============ Notifications Router ============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => {
        return db.getUserNotifications(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
