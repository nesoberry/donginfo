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

import { toast } from "sonner";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const eventId = parseInt(id || "0", 10);

  // 행사 상세 조회
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

  // 구독 상태 조회
  const { data: subscription } = trpc.subscriptions.getByEventId.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );

  // 구독 생성
  const createSubscription = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      utils.subscriptions.getByEventId.invalidate({ eventId });
      toast.success("알림 구독이 완료되었습니다");
    },
    onError: (error) => {
      toast.error(error.message || "구독 중 오류가 발생했습니다");
    },
  });

  // 구독 삭제
  const deleteSubscription = trpc.subscriptions.delete.useMutation({
    onSuccess: () => {
      utils.subscriptions.getByEventId.invalidate({ eventId });
      toast.success("알림 구독이 취소되었습니다");
    },
    onError: (error) => {
      toast.error(error.message || "구독 취소 중 오류가 발생했습니다");
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
        notifyOneDayBefore: "push",
        notifyOneHourBefore: "push",
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
        <div className="container py-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 행사 정보 */}
          <div className="lg:col-span-2">
            <Card className="event-card p-8">
              {/* 제목 및 배지 */}
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  {event.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {event.region && <Badge>{event.region}</Badge>}
                  <Badge className="badge-accent">진행 예정</Badge>
                </div>
              </div>

              {/* 설명 */}
              {event.description && (
                <div className="mb-8">
                  <p className="text-lg text-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* 구분선 */}
              <div className="section-divider" />

              {/* 행사 정보 */}
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    행사 날짜
                  </h3>
                  <div className="flex items-center gap-3 text-lg">
                    <Calendar className="w-5 h-5 text-primary" />
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
                  <div className="flex items-center gap-3 text-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{event.location}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    예매 오픈
                  </h3>
                  <div className="flex items-center gap-3 text-lg">
                    <Ticket className="w-5 h-5 text-primary" />
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
            <Card className="event-card p-6 sticky top-24">
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

                  <p className="text-xs text-muted-foreground">
                    로그인하면 이 페이지를 열지 않아도 스마트폰·PC 화면에 팝업으로 알림이 와요
                  </p>

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
                    알림을 받으려면 로그인이 필요합니다
                  </p>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setLocation("/")}
                  >
                    로그인하러 가기
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
