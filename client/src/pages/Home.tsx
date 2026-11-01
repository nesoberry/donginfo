import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, MapPin, Ticket, LayoutGrid, Sparkles, Bell, X, Search, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format, differenceInCalendarDays, startOfDay, endOfWeek, endOfMonth, isWithinInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { VERIFIED_FREE_EVENT_IDS } from "@/const";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { usePushNotification } from "@/hooks/usePushNotification";
import { usePageMeta } from "@/hooks/usePageMeta";

type DateFilter = "all" | "weekend" | "month";

export default function Home() {
  usePageMeta({
    title: "전국 동인행사 일정 한눈에 | 동인 행사 알리미",
    description:
      "코믹월드, 일러스타페스, AGF 등 전국 동인·서브컬처 행사 일정을 한눈에. 날짜·장소·티켓 정보와 코스프레 가능 여부까지 확인하세요.",
  });
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCosplayOnly, setShowCosplayOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotification();

  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    search: searchTerm || undefined,
  });

  const today = startOfDay(new Date());

  // D-day 계산
  const getDDay = (eventDate: Date | string) => {
    return differenceInCalendarDays(startOfDay(new Date(eventDate)), today);
  };

  // 임박한 행사 (7일 이내) — 히어로용
  const imminentEvents = useMemo(() => {
    return events
      .filter(e => {
        const d = getDDay(e.eventDate);
        return d >= 0 && d <= 7;
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 3);
  }, [events]);

  // 지역 목록
  const regions = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.region) set.add(e.region);
    });
    return Array.from(set).sort();
  }, [events]);

  // 필터링
  const filteredEvents = useMemo(() => {
    let result = events;

    // 코스프레 필터
    if (showCosplayOnly) {
      result = result.filter(e => e.allowsCosplay !== 'no');
    }

    // 지역 필터
    if (selectedRegion) {
      result = result.filter(e => e.region === selectedRegion);
    }

    // 날짜 필터
    if (dateFilter === "weekend") {
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      result = result.filter(e => {
        const d = new Date(e.eventDate);
        return isWithinInterval(d, { start: today, end: weekEnd });
      });
    } else if (dateFilter === "month") {
      const monthEnd = endOfMonth(today);
      result = result.filter(e => {
        const d = new Date(e.eventDate);
        return isWithinInterval(d, { start: today, end: monthEnd });
      });
    }

    // 날짜순 정렬
    return [...result].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events, showCosplayOnly, selectedRegion, dateFilter, today]);

  const handleEventClick = (eventId: number) => {
    setLocation(`/event/${eventId}` as string);
  };

  const handleAdminClick = () => {
    setLocation("/admin" as string);
  };

  const showBanner = isAuthenticated && isSupported && !isSubscribed && !bannerDismissed;

  const hasActiveFilters = searchTerm || showCosplayOnly || selectedRegion || dateFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">동인 행사 일정</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Button
              onClick={() => setLocation("/calendar" as string)}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3"
            >
              <Calendar className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">캘린더</span>
            </Button>

            {isAuthenticated && (
              <Button
                onClick={() => setLocation("/notifications" as string)}
                variant="outline"
                size="sm"
                className="px-2 sm:px-3"
              >
                <Bell className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">알림</span>
              </Button>
            )}

            {isAuthenticated && user?.role === "admin" && (
              <Button
                onClick={handleAdminClick}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">관리자 패널</span>
                <span className="sm:hidden">관리</span>
              </Button>
            )}

            {isAuthenticated && (
              <span className="hidden sm:block text-sm text-muted-foreground">
                {user?.name || "사용자"}
              </span>
            )}

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
              >
                로그아웃
              </Button>
            ) : (
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <div className="sm:hidden">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        const apiUrl = import.meta.env.VITE_API_URL || "";
                        const res = await fetch(`${apiUrl}/api/auth/google`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ credential: credentialResponse.credential }),
                        });
                        if (res.ok) window.location.reload();
                      } catch (err) {
                        console.error("로그인 에러:", err);
                      }
                    }}
                    onError={() => console.log("구글 로그인 실패")}
                    type="icon"
                    shape="circle"
                    size="medium"
                  />
                </div>
                <div className="hidden sm:block">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        const apiUrl = import.meta.env.VITE_API_URL || "";
                        const res = await fetch(`${apiUrl}/api/auth/google`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ credential: credentialResponse.credential }),
                        });
                        if (res.ok) window.location.reload();
                      } catch (err) {
                        console.error("로그인 에러:", err);
                      }
                    }}
                    onError={() => console.log("구글 로그인 실패")}
                    size="small"
                  />
                </div>
              </GoogleOAuthProvider>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4">
        {/* 코스프레 패키지 진입 배너 — 카드형, 첫 화면 */}
        <a
          href="/package?utm_source=home_banner"
          className="mt-4 flex flex-col gap-3 rounded-xl bg-primary px-5 py-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight sm:text-xl">코스프레, 몸만 오세요</p>
            <p className="mt-1 text-sm opacity-90">의상·가발·메이크업·촬영까지 한 번에 · 사전 신청 중</p>
          </div>
          <span className="inline-flex w-full flex-shrink-0 items-center justify-center gap-1 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary sm:w-auto">
            사전 신청하기
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </a>

        {/* 푸시 알림 배너 */}
        {showBanner && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-card px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">행사 알림을 받아보세요</p>
                <p className="text-xs text-muted-foreground hidden sm:block">예매 오픈일, 행사 전날 알림을 브라우저로 받을 수 있어요</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={async () => { await subscribe(); }}
                disabled={pushLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                알림 켜기
              </Button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 히어로: 임박한 행사 */}
        {!isLoading && imminentEvents.length > 0 && !hasActiveFilters && (
          <section className="py-8 sm:py-12">
            <div className="flex items-baseline justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                곧 열리는 행사
              </h2>
              <span className="text-sm text-muted-foreground">7일 이내</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {imminentEvents.map(event => {
                const dday = getDDay(event.eventDate);
                return (
                  <article
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEventClick(event.id);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`${event.name} 상세 보기`}
                    className="group cursor-pointer rounded-xl bg-primary p-5 sm:p-6 text-primary-foreground"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        {dday === 0 ? "오늘" : dday === 1 ? "내일" : `D-${dday}`}
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(event.eventDate), "M월 d일 (EEEE)", { locale: ko })}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm opacity-90 mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 검색 및 필터 */}
        <section className="py-6 sm:py-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
            모든 행사
          </h2>

          {/* 검색 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="행사명, 장소명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:max-w-md"
            />
          </div>

          {/* 날짜 필터 */}
          <div className="flex gap-2 mb-4">
            {([
              { key: "all", label: "전체" },
              { key: "weekend", label: "이번 주말" },
              { key: "month", label: "이번 달" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 지역 필터 */}
          {regions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedRegion === null
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                전국
              </button>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedRegion === region
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          )}

          {/* 코스프레 필터 */}
          <button
            onClick={() => setShowCosplayOnly(!showCosplayOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              showCosplayOnly
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            코스프레 가능만
          </button>
        </section>

        {/* 행사 목록 */}
        <section className="pb-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {hasActiveFilters ? "조건에 맞는 행사가 없습니다" : "등록된 행사가 없습니다"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowCosplayOnly(false);
                    setSelectedRegion(null);
                    setDateFilter("all");
                  }}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  필터 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-6xl mx-auto">
              {filteredEvents.map(event => {
                const dday = getDDay(event.eventDate);
                const isImminent = dday >= 0 && dday <= 7;
                const isPast = dday < 0;

                return (
                  <article
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEventClick(event.id);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`${event.name} 상세 보기`}
                    className={`group cursor-pointer rounded-xl p-4 sm:p-5 flex gap-4 sm:gap-5 transition-colors ${
                      isImminent && !isPast
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "bg-card hover:bg-muted"
                    } ${isPast ? "opacity-60" : ""}`}
                  >
                    {/* 날짜 블록 — suta: 핵심 정보는 크게 */}
                    <div className="flex-shrink-0 w-14 sm:w-16 text-center">
                      <div className={`text-2xl sm:text-3xl font-bold leading-none ${isImminent && !isPast ? "text-primary" : "text-foreground"}`}>
                        {format(new Date(event.eventDate), "d")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.eventDate), "M월 EEE", { locale: ko })}
                      </div>
                      {!isPast && dday <= 30 && (
                        <div className={`text-xs font-semibold mt-1 ${isImminent ? "text-primary" : "text-muted-foreground"}`}>
                          {dday === 0 ? "오늘" : `D-${dday}`}
                        </div>
                      )}
                    </div>

                    {/* 구분선 */}
                    <div className="w-px bg-border flex-shrink-0" />

                    {/* 행사 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mb-2">
                        {event.region && <span>{event.region}</span>}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location || "장소 미정"}</span>
                        </span>
                        {event.allowsCosplay === 'yes' && (
                          <span className="inline-flex items-center gap-1 text-primary font-medium">
                            <Sparkles className="w-3 h-3" />
                            코스프레 가능
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Ticket className="w-3.5 h-3.5" />
                        {event.ticketLink ? (
                          <span className="font-medium text-foreground">사전 예매 중</span>
                        ) : VERIFIED_FREE_EVENT_IDS.includes(event.id) ? (
                          <span className="font-medium text-foreground">무료 입장</span>
                        ) : (
                          <span>티켓 정보 미정</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border mt-8">
        <div className="container px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 동인 행사 알리미</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-foreground">개인정보처리방침</a>
            <a href="/copyright" className="hover:text-foreground">저작권 및 면책사항</a>
            <a href="/package?utm_source=footer" className="hover:text-foreground">코스프레 패키지</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
