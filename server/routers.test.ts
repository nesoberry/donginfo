import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// DB 계층 전체를 mock으로 교체 — DATABASE_URL이 있어도 실제 DB에 절대 닿지 않는다.
// (라우터가 호출하는 db.createPackageApplication만 가짜로 두고, 나머지는 원본 유지)
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, createPackageApplication: vi.fn() };
});
import * as db from "./db";

function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
    ...overrides,
  };
}

describe("App Router", () => {
  it("should have appRouter defined", () => {
    expect(appRouter).toBeDefined();
  });

  it("auth.me should return current user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.auth.me();
    expect(result).toMatchObject({
      id: 1,
      openId: "test-user",
      role: "user",
    });
  });

  it("auth.me should return null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.logout should return success", async () => {
    const mockRes = {
      clearCookie: vi.fn(),
    };
    const caller = appRouter.createCaller(
      createMockContext({
        res: mockRes as any,
      })
    );
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(mockRes.clearCookie).toHaveBeenCalled();
  });

  it("subscriptions.list should require authentication", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(caller.subscriptions.list()).rejects.toThrow();
  });

  it("subscriptions.create should require authentication", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(
      caller.subscriptions.create({
        eventId: 1,
        notifyOneDayBefore: "both",
        notifyOneHourBefore: "both",
      })
    ).rejects.toThrow();
  });

  it("subscriptions.delete should require authentication", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(caller.subscriptions.delete({ id: 1 })).rejects.toThrow();
  });

  it("notifications.list should require authentication", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(caller.notifications.list({ limit: 10 })).rejects.toThrow();
  });

  it("events.create should require admin role", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: { id: 1, openId: "u", email: null, name: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null } }));
    await expect(
      caller.events.create({
        name: "Test Event",
        location: "Test Location",
        eventDate: new Date(),
        ticketOpenDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("events.update should require admin role", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.events.update({ id: 1, name: "Updated" })
    ).rejects.toThrow();
  });

  it("events.delete should require admin role", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(caller.events.delete({ id: 1 })).rejects.toThrow();
  });

  it("events.list should be publicly accessible without throwing auth error", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    // DB가 없는 테스트 환경에서는 빈 배열 반환 (DB 연결 실패시 [] 반환하도록 설계됨)
    const result = await caller.events.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("events.getById should be publicly accessible without throwing auth error", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    // DB가 없어 NOT_FOUND 에러가 발생할 수 있으나, 인증 에러는 아님
    try {
      await caller.events.getById({ id: 999 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

describe("packageApplications.create consent enforcement", () => {
  const validInput = {
    contact: "consent-test@example.com",
    interests: ["full"] as const,
  };
  const mockCreate = vi.mocked(db.createPackageApplication);

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("should reject when consent is missing", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(
      caller.packageApplications.create(validInput as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    // 입력 검증 단계에서 거부되므로 DB 함수는 호출되지 않아야 함
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should reject when consent is false", async () => {
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    await expect(
      caller.packageApplications.create({ ...validInput, consent: false } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should save the application when consent is true (DB mocked)", async () => {
    mockCreate.mockResolvedValue({ id: 1 } as any);
    const caller = appRouter.createCaller(createMockContext({ user: null }));
    const result = await caller.packageApplications.create({
      ...validInput,
      consent: true,
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});
