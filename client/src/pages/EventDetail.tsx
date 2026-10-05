import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, MapPin, Ticket, ArrowLeft, Bell, BellOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import { toast } from "sonner";
import { useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

function EventDetailInner() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const handleGoogleLoginSuccess = async (credentialResponse: { credential?: string }) => {
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
        toast.error("로그인 처리 중 문제가 발생했습니다.");
      }
    } catch (err) {
      console.error("네트워크 통신 에러:", err);
      toast.error("로그인 중 오류가 발생했습니다.");
    }
  };

  const eventId = parseInt(id || "0", 10);

  // 행사 상세 조회
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

  // 알림 상태 조회
  const { data: subscription } = trpc.subscriptions.getByEventId.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );

  // SEO: 페이지별 타이틀/메타 + Event 구조화 데이터
  const eventDateStr = event
    ? format(new Date(event.eventDate), "yyyy년 M월 d일", { locale: ko })
    : "";
  usePageMeta({
    title: event ? `${event.name} | 동인 행사 알리미` : "행사 상세 | 동인 행사 알리미",
    description: event
      ? `${eventDateStr} ${event.location}에서 열리는 ${event.name} 일정·장소·티켓 정보를 확인하세요.`
      : undefined,
  });

  useEffect(() => {
    if (!event) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "event-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.name,
      startDate: new Date(event.eventDate).toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: event.location,
        address: event.region ?? undefined,
      },
      description: event.description ?? undefined,
      url: `https://www.donginfo.com/event/${event.id}`,
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("event-jsonld")?.remove();
    };
  }, [event]);

  // 알림 설정
  const createSubscription = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      utils.subscriptions.getByEventId.invalidate({ eventId });
      toast.success("알림 설정이 완료되었습니다");
    },
    onError: (error) => {
      toast.error(error.message || "오류가 발생했습니다");
    },
  });

  // 알림 해제
  const deleteSubscription = trpc.subscriptions.delete.useMutation({
    onSuccess: () => {
      utils.subscriptions.getByEventId.invalidate({ eventId });
      toast.success("알림이 해제되었습니다");
    },
    onError: (error) => {
      toast.error(error.message || "오류가 발생했습니다");
    },
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (subscription) {
      deleteSubscription.mutate({ id: subscription.id });
    } else {
      createSubscription.mutate({
        eventId,
        notifyOneDayBefore: "inapp",
        notifyOneHourBefore: "inapp",
      });
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">행사를 찾을 수 없습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container px-4 py-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 왼쪽: 행사 정보 */}
          <div className="lg:col-span-2">
            <Card className="event-card p-4 sm:p-8">
              {/* 제목 및 배지 */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                  {event.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {event.region && <Badge>{event.region}</Badge>}
                  <Badge className="badge-accent">진행 예정</Badge>
                </div>
              </div>

              {/* 설명 */}
              {event.description && (
                <div className="mb-6 sm:mb-8">
                  <p className="text-base sm:text-lg text-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* 구분선 */}
              <div className="section-divider" />

              {/* 행사 정보 */}
              <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    행사 날짜
                  </h3>
                  <div className="flex items-center gap-3 text-base sm:text-lg">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">
                      {format(new Date(event.eventDate), "yyyy년 M월 d일 (EEEE)", {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    장소
                  </h3>
                  <div className="flex items-center gap-3 text-base sm:text-lg">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{event.location}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    예매 오픈
                  </h3>
                  <div className="flex items-center gap-3 text-base sm:text-lg">
                    <Ticket className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">
                      {format(new Date(event.ticketOpenDate), "yyyy년 M월 d일 HH:mm", {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 구분선 */}
              <div className="section-divider" />

              {/* 링크 섹션 */}
              <div className="space-y-4">
                {event.ticketLink && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      예매처
                    </h3>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        if (event.ticketLink) window.open(event.ticketLink, "_blank");
                      }}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      예매하러 가기
                    </Button>
                  </div>
                )}

                {event.mapLink && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      행사안내
                    </h3>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (event.mapLink) window.open(event.mapLink, "_blank");
                      }}
                    >
                      행사안내 보기
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 알림 구독 */}
          <div>
            <Card className="event-card p-4 sm:p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                예매 알림 받기
              </h3>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    예매 놓치지 마세요! 구독하면 아래 시점에 알림을 드려요.
                  </p>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-semibold mt-0.5">•</span>
                      <span>행사 하루 전 오후 6시</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-semibold mt-0.5">•</span>
                      <span>예매 오픈 1시간 전</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubscribe}
                    disabled={createSubscription.isPending || deleteSubscription.isPending}
                    className={`w-full ${
                      subscription
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {createSubscription.isPending || deleteSubscription.isPending ? (
                      <Spinner className="w-4 h-4 mr-2" />
                    ) : subscription ? (
                      <>
                        <BellOff className="w-4 h-4 mr-2" />
                        구독 취소
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        알림 설정
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    로그인하면 이 페이지를 열지 않아도 스마트폰·PC 화면에 팝업으로 알림이 와요
                  </p>
                  <div className="flex justify-center overflow-hidden">
                    <GoogleLogin
                      onSuccess={handleGoogleLoginSuccess}
                      onError={() => toast.error("구글 로그인 실패")}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EventDetail() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <EventDetailInner />
    </GoogleOAuthProvider>
  );
}
