import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
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
  });
});
