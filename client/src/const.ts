export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

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
