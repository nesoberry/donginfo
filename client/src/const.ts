export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// 현재 origin을 안전하게 가져오는 함수
const getOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

// Google 로그인 URL 생성
export const getGoogleLoginUrl = () => {
  return `${getOrigin()}/api/auth/google`;
};

// 로그인 URL 생성 (Manus OAuth가 설정되어 있으면 Manus, 아니면 Google로 폴백)
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Manus OAuth 환경변수가 없거나 비어있으면 Google 로그인으로 폴백
  if (!oauthPortalUrl || !appId) {
    return getGoogleLoginUrl();
  }

  try {
    const redirectUri = `${getOrigin()}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL("/app-auth", oauthPortalUrl);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    // URL 생성 실패 시 Google 로그인으로 폴백
    return getGoogleLoginUrl();
  }
};