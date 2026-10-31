import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

// db만 mock한다. toKstDay는 실제 구현을 쓴다.
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    findEventByNameAndDate: vi.fn(),
    isEventTombstoned: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  };
});

import { ingestRouter } from "./ingest";
import {
  findEventByNameAndDate,
  isEventTombstoned,
  createEvent,
  updateEvent,
} from "./db";

const mockedFind = vi.mocked(findEventByNameAndDate);
const mockedTombstoned = vi.mocked(isEventTombstoned);
const mockedCreate = vi.mocked(createEvent);
const mockedUpdate = vi.mocked(updateEvent);

describe("ingest POST /events", () => {
  let baseUrl: string;
  let server: ReturnType<typeof import("express").default.application.listen> | any;

  beforeAll(async () => {
    process.env.INGEST_API_KEY = "test-ingest-key";
    const app = express();
    app.use(express.json());
    app.use(ingestRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const post = (events: unknown[]) =>
    fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-ingest-key",
      },
      body: JSON.stringify({ events }),
    }).then((r) => r.json());

  it("삭제 표시가 있으면 새로 만들지 않고 건너뛴다", async () => {
    mockedFind.mockResolvedValue(null);
    mockedTombstoned.mockResolvedValue(true);
    const result = await post([
      { name: "지운 행사", eventDate: "2026-12-04T00:00:00+09:00" },
    ]);
    expect(result).toEqual({ inserted: 0, skipped: 1 });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("기존 줄이 있으면 삭제 표시보다 먼저 보고 빈 ticketLink를 채운다", async () => {
    mockedFind.mockResolvedValue({ id: 7, ticketLink: null } as any);
    mockedTombstoned.mockResolvedValue(true); // 표시가 있어도 기존 줄이 우선
    const result = await post([
      {
        name: "기존 행사",
        eventDate: "2026-12-04T00:00:00+09:00",
        ticketLink: "https://example.com/ticket",
      },
    ]);
    expect(result).toEqual({ inserted: 0, skipped: 1 });
    expect(mockedUpdate).toHaveBeenCalledWith(7, {
      ticketLink: "https://example.com/ticket",
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("별칭 이름은 정식 명칭으로 만들어진다", async () => {
    mockedFind.mockResolvedValue(null);
    mockedTombstoned.mockResolvedValue(false);
    mockedCreate.mockResolvedValue({ id: 99 } as any);
    const result = await post([
      { name: "AGF KOREA 2026", eventDate: "2026-12-04T00:00:00+09:00" },
    ]);
    expect(result).toEqual({ inserted: 1, skipped: 0 });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Anime X Game Festival 2026" }),
    );
  });
});
