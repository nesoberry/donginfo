import { OAuth2Client } from "google-auth-library";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import * as db from "../db";

// 구글이 발급한 ID 토큰이 진짜인지 검증할 때 쓰는 클라이언트
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// 우리 로그인 쿠키(JWT)에 서명할 때 쓰는 비밀키
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

// 쿠키 안에 담는 정보의 형태
export type SessionPayload = {
  openId: string; // 사용자 고유 식별자 (구글 sub 앞에 google_ 붙임)
  name: string;
};

/**
 * 화면(클라이언트)에서 받은 구글 ID 토큰을 검증한다.
 * 진짜 구글이 발급한 토큰이 맞으면 사용자 정보를 돌려주고,
 * 아니면 에러를 던진다.
 */
async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID, // 우리 앱에 발급된 토큰인지 확인
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new Error("구글 토큰에서 사용자 정보를 읽을 수 없습니다");
  }

  return {
    sub: payload.sub, // 구글 사용자 고유 번호
    email: payload.email ?? null,
    name: payload.name ?? null,
  };
}

/**
 * 우리 서비스의 로그인 쿠키(JWT)를 만든다.
 * "이 사람은 로그인했다"는 도장 역할.
 */
async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ openId: payload.openId, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
}

/**
 * 로그인 쿠키(JWT)를 검증해서 안의 내용을 꺼낸다.
 * 쿠키가 위조됐거나 만료됐으면 null.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.openId !== "string") return null;
    return {
      openId: payload.openId,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

/**
 * 요청의 쿠키 헤더에서 우리 세션 쿠키 값을 꺼낸다.
 */
export function getSessionCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const cookies = parseCookieHeader(header);
  return cookies[COOKIE_NAME];
}

/**
 * [로그인 핸들러]
 * 화면에서 보낸 구글 ID 토큰을 받아서:
 * 1. 구글에 진짜인지 검증
 * 2. 사용자 정보를 DB에 저장(upsert)
 * 3. 로그인 쿠키를 발급
 */
export async function googleLoginHandler(req: Request, res: Response) {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      return res.status(400).json({ error: "구글 토큰(credential)이 없습니다" });
    }

    // 1. 구글 토큰 검증
    const googleUser = await verifyGoogleToken(credential);

    // 2. DB에 사용자 저장 (openId = google_ + 구글 고유번호)
    const openId = `google_${googleUser.sub}`;
    await db.upsertUser({
      openId,
      name: googleUser.name,
      email: googleUser.email,
      loginMethod: "google",
      lastSignedIn: new Date(),
    });

    const user = await db.getUserByOpenId(openId);
    if (!user) {
      return res.status(500).json({ error: "사용자 저장에 실패했습니다" });
    }

    // 3. 로그인 쿠키 발급
    const token = await createSessionToken({
      openId: user.openId,
      name: user.name ?? "",
    });

    res.cookie(COOKIE_NAME, token, {
      ...getSessionCookieOptions(req),
      maxAge: ONE_YEAR_MS,
    });

    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[GoogleAuth] 로그인 실패:", error);
    return res.status(401).json({
      error: error instanceof Error ? error.message : "로그인에 실패했습니다",
    });
  }
}

/**
 * [로그아웃 핸들러]
 * 로그인 쿠키를 지운다.
 */
export function logoutHandler(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
  return res.json({ ok: true });
}