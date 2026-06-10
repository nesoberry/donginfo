/**
 * VAPID 키 생성 스크립트 (최초 1회만 실행)
 * 실행: pnpm tsx scripts/generate-vapid.ts
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\n✅ VAPID 키 생성 완료! 아래 내용을 .env에 추가하세요:\n");
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("\n⚠️  VAPID_PRIVATE_KEY는 절대 외부에 노출하지 마세요.");
