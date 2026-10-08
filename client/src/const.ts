export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * 무료 입장이 확인된 행사 ID 목록 (2026-10-08 리서치 기준).
 * ticketLink가 없는 행사는 기본적으로 "티켓 정보 미정"으로 표시되며,
 * 이 목록에 있는 행사는 "무료 입장"으로 표시됨.
 * TODO: DB에 ticketType 컬럼이 생기면 이 상수를 제거하고 DB 값을 사용할 것.
 * 주간 품질 점검에서 신규 무료 행사를 발견하면 여기에 추가.
 */
export const VERIFIED_FREE_EVENT_IDS: number[] = [
  90035, // 한일축제한마당 2026 in Seoul — "입장료는 무료입니다" 공식 명시
  90037, // 제5회 대구콘텐츠페어 — 공식 사전관람신청(무료)
];

// 현재 origin을 안전하게 가져오는 함수
const getOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

// 로그인 URL — 세션 만료 시 홈으로 이동 (Google OAuth 로그인 버튼이 홈/이벤트 페이지에 있음)
export const getLoginUrl = () => {
  return "/";
};
