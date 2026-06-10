export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// 현재 origin을 안전하게 가져오는 함수
const getOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

// 로그인 URL — Google OAuth 고정
export const getLoginUrl = () => {
  return `${getOrigin()}/api/auth/google`;
};
