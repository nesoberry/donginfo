/**
 * 행사명 별칭 정규화 — 수집 중복 방지용.
 *
 * 수집기(코믹월드 캘린더 등)는 행사명을 짧은 통칭으로 적는 경우가 있고,
 * 관리자·수동 등록은 공식 정식 명칭을 쓰는 경우가 있다. 수집 중복 판정이
 * (행사명, 날짜) 정확 일치라서, 이름만 다른 같은 행사가 별도 줄로 들어간다.
 * (실례: 코믹월드 캘린더의 'AGF KOREA 2026' vs 정식 명칭
 * 'Anime X Game Festival 2026' — 2026-10-28 삭제된 90024가 같은 날 수집으로
 * 90043으로 부활한 원인.)
 *
 * 이 맵은 수집 입력에만 적용한다. 기존 DB 행의 이름을 바꾸지 않으며,
 * 별칭은 사람이 직접 확인한 쌍만 여기에 추가한다. 새 별칭을 추가할 때는
 * 공식 일정(날짜·장소)이 같은 행사인지 먼저 대조할 것.
 * 별칭에는 연도가 들어 있으므로 연도별로 추가한다 (예: 2027년 AGF는 별도 쌍).
 */
export const EVENT_NAME_ALIASES: Record<string, string> = {
  "AGF KOREA 2026": "Anime X Game Festival 2026",
};

/** 수집된 행사명을 정식 명칭으로 정규화한다 (앞뒤 공백 제거 후 별칭 대조). */
export function canonicalEventName(name: string): string {
  const trimmed = name.trim();
  return EVENT_NAME_ALIASES[trimmed] ?? trimmed;
}
