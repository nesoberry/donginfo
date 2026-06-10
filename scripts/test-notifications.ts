/**
 * 알림 시스템 테스트 스크립트
 * 실행: pnpm tsx scripts/test-notifications.ts
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users, events, subscriptions, notifications } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;

async function main() {
  console.log("=".repeat(50));
  console.log("🧪 알림 시스템 테스트 시작");
  console.log("=".repeat(50));

  // ── 1. DB 연결 ──
  console.log("\n📦 [1] DB 연결 테스트...");
  let db: ReturnType<typeof drizzle>;
  try {
    db = drizzle(DATABASE_URL);
    console.log("  ✅ DB 연결 성공");
  } catch (err) {
    console.error("  ❌ DB 연결 실패:", err);
    process.exit(1);
  }

  // ── 2. 유저 확인 ──
  console.log("\n👤 [2] 등록된 유저 확인...");
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    openId: users.openId,
  }).from(users);
  console.log(`  총 ${allUsers.length}명`);
  allUsers.forEach(u => console.log(`  - [${u.id}] ${u.name} (${u.email})`));

  if (allUsers.length === 0) {
    console.log("  ⚠️  등록된 유저가 없습니다. 먼저 로그인하세요.");
    return;
  }

  // ── 3. 행사 확인 ──
  console.log("\n🎪 [3] 등록된 행사 확인...");
  const allEvents = await db.select({
    id: events.id,
    name: events.name,
    ticketOpenDate: events.ticketOpenDate,
  }).from(events);
  console.log(`  총 ${allEvents.length}개`);
  allEvents.forEach(e => console.log(`  - [${e.id}] ${e.name} / 예매오픈: ${e.ticketOpenDate}`));

  if (allEvents.length === 0) {
    console.log("  ⚠️  등록된 행사가 없습니다.");
    return;
  }

  // ── 4. 구독 확인 ──
  console.log("\n🔔 [4] 구독 현황 확인...");
  const allSubs = await db.select().from(subscriptions);
  console.log(`  총 ${allSubs.length}개`);
  allSubs.forEach(s =>
    console.log(`  - userId:${s.userId} → eventId:${s.eventId} | D-1:${s.notifyOneDayBefore}, 1시간전:${s.notifyOneHourBefore}`)
  );

  // ── 5. 기존 알림 기록 확인 ──
  console.log("\n📋 [5] 기존 알림 기록 확인...");
  const allNotifs = await db.select().from(notifications).limit(10);
  console.log(`  최근 ${allNotifs.length}개`);
  allNotifs.forEach(n =>
    console.log(`  - [${n.id}] userId:${n.userId} eventId:${n.eventId} | ${n.notificationType} / ${n.status}`)
  );

  // ── 6. 이메일 발송 테스트 ──
  console.log("\n📧 [6] 이메일 직접 발송 테스트...");
  const testEmail = allUsers[0].email;
  if (!testEmail) {
    console.log("  ⚠️  첫 번째 유저에 이메일 없음. 스킵.");
  } else {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });

      const result = await transporter.sendMail({
        from: `"동인행사 알리미" <${EMAIL_USER}>`,
        to: testEmail,
        subject: "[테스트] 동인행사 알리미 알림 테스트",
        html: `
          <h2>🧪 알림 테스트 메일입니다</h2>
          <p>이 메일이 보이면 이메일 알림이 정상 작동합니다.</p>
          <p>발송 시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
        `,
      });
      console.log(`  ✅ 이메일 발송 성공 → ${testEmail}`);
      console.log(`  메시지 ID: ${result.messageId}`);
    } catch (err: any) {
      console.error("  ❌ 이메일 발송 실패:", err.message);
      if (err.message?.includes("Username and Password not accepted")) {
        console.error("  → Gmail 앱 비밀번호를 확인하세요. (2단계 인증 후 앱 비밀번호 발급 필요)");
      }
    }
  }

  // ── 7. 테스트 알림 레코드 생성 후 발송 ──
  if (allSubs.length > 0 && allEvents.length > 0) {
    const sub = allSubs[0];
    const event = allEvents[0];
    const targetUser = allUsers.find(u => u.id === sub.userId);

    console.log(`\n🚀 [7] 테스트 알림 레코드 생성 (eventId:${event.id}, userId:${sub.userId})...`);

    // 이메일 알림 레코드 삽입
    await db.insert(notifications).values({
      subscriptionId: sub.id,
      eventId: event.id,
      userId: sub.userId,
      notificationType: "email",
      triggerType: "one_day_before",
      status: "pending",
    });
    console.log("  ✅ 테스트 알림 레코드 삽입 완료");

    // 방금 넣은 pending 알림 처리
    if (targetUser?.email) {
      console.log(`\n📤 [8] 방금 생성한 알림 실제 발송 (→ ${targetUser.email})...`);
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        await transporter.sendMail({
          from: `"동인행사 알리미" <${EMAIL_USER}>`,
          to: targetUser.email,
          subject: `[동인행사 알리미] ${event.name} 예매 내일 오픈!`,
          html: `<h3>🎉 ${event.name}</h3><p>예매 오픈이 <strong>내일</strong>입니다. 놓치지 마세요!</p>`,
        });

        // DB 상태 업데이트
        await db
          .update(notifications)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(notifications.userId, sub.userId));

        console.log("  ✅ 발송 완료 및 DB 상태 업데이트");
      } catch (err: any) {
        console.error("  ❌ 발송 실패:", err.message);
      }
    }
  } else {
    console.log("\n⚠️  [7] 구독이 없어서 알림 레코드 생성 스킵");
    console.log("  → 먼저 로그인 후 행사 페이지에서 구독하세요.");
  }

  console.log("\n" + "=".repeat(50));
  console.log("테스트 완료");
  console.log("=".repeat(50));
  process.exit(0);
}

main().catch(err => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
