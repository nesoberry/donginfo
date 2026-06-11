import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, MapPin, Ticket, LayoutGrid, Sparkles, Bell, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { usePushNotification } from "@/hooks/usePushNotification";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCosplayOnly, setShowCosplayOnly] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotification();

  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    search: searchTerm || undefined,
  });

  const filteredEvents = useMemo(() => {
    if (!showCosplayOnly) return events;
    return events.filter(event => event.allowsCosplay !== 'no');
  }, [events, showCosplayOnly]);

  const handleEventClick = (eventId: number) => {
    setLocation(`/event/${eventId}` as string);
  };

  const handleAdminClick = () => {
    setLocation("/admin" as string);
  };

  const showBanner = isAuthenticated && isSupported && !isSubscribed && !bannerDismissed;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container px-4 py-3 flex items-center justify-between gap-2">

          {/* 왼쪽: 로고 + 타이틀 */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">동인 행사 일정</h1>
          </div>

          {/* 오른쪽: 버튼들 */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* 캘린더 버튼: 모바일은 아이콘만 */}
            <Button
              onClick={() => setLocation("/calendar" as string)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 px-2 sm:px-3"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">캘린더</span>
            </Button>

            {/* 알림 버튼: 모바일은 아이콘만 */}
            {isAuthenticated && (
              <Button
                onClick={() => setLocation("/notifications" as string)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 px-2 sm:px-3"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">알림</span>
              </Button>
            )}

            {/* 관리자 패널: 모바일에서 축약 */}
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

            {/* 사용자 이름: 모바일에서 숨김 */}
            {isAuthenticated && (
              <span className="hidden sm:block text-sm text-muted-foreground">
                {user?.name || "사용자"}
              </span>
            )}

            {/* 로그인/로그아웃 */}
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
                      const data = await res.json();
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        console.error("백엔드 거절:", data.error);
                        alert("로그인 처리 중 문제가 발생했습니다.");
                      }
                    } catch (err) {
                      console.error("네트워크 통신 에러:", err);
                    }
                  }}
                  onError={() => console.log("구글 로그인 실패")}
                  size="small"
                />
              </GoogleOAuthProvider>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container px-4 py-8 sm:py-12">

        {/* 푸시 알림 배너 */}
        {showBanner && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
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
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 검색 및 필터 섹션 */}
        <div className="mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-1 sm:mb-2">
              행사를 찾아보세요
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              서울코믹월드, 일러스타페스 등 주요 동인 행사의 일정을 한눈에 확인하세요
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <Input
              placeholder="행사명, 장소명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-md"
            />
            <Button
              variant={showCosplayOnly ? "default" : "outline"}
              onClick={() => setShowCosplayOnly(!showCosplayOnly)}
              className="w-full sm:w-fit"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {showCosplayOnly ? "코스프레 가능 행사만" : "코스프레 가능 행사 보기"}
            </Button>
          </div>
        </div>

        {/* 행사 목록 */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm || showCosplayOnly ? "검색 결과가 없습니다" : "등록된 행사가 없습니다"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {filteredEvents.map(event => (
                <Card
                  key={event.id}
                  className="event-card cursor-pointer group"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="event-card-header">
                    <h3 className="event-card-title group-hover:text-primary transition-colors text-base sm:text-lg">
                      {event.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      {event.region && (
                        <Badge variant="secondary" className="text-xs">
                          {event.region}
                        </Badge>
                      )}
                      {event.allowsCosplay === 'yes' && (
                        <Badge className="text-xs bg-primary text-primary-foreground">
                          <Sparkles className="w-3 h-3 mr-1" />
                          코스프레 가능
                        </Badge>
                      )}
                      {event.allowsCosplay === 'limited' && (
                        <Badge variant="outline" className="text-xs">
                          코스프레 제한
                        </Badge>
                      )}
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="event-card-meta text-xs sm:text-sm">
                    <div className="event-card-meta-item">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>
                        {format(new Date(event.eventDate), "MMM dd, yyyy", { locale: ko })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2 sm:mb-3">
                      <span className="font-semibold">예매 오픈:</span>{" "}
                      {format(new Date(event.ticketOpenDate), "MMM dd, HH:mm", { locale: ko })}
                    </div>
                    <div className="flex gap-2">
                      {event.ticketLink && (
                        <Button
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.ticketLink) window.open(event.ticketLink, "_blank");
                          }}
                        >
                          <Ticket className="w-4 h-4 mr-1" />
                          예매하기
                        </Button>
                      )}
                      {event.mapLink && (
                        <Button
                          size="sm"
                          className="flex-1"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.mapLink) window.open(event.mapLink, "_blank");
                          }}
                        >
                          행사안내
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
