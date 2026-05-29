import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, MapPin, Ticket, LayoutGrid, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCosplayOnly, setShowCosplayOnly] = useState(false);


  // 행사 목록 조회
  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    search: searchTerm || undefined,
  });



  // 필터링된 행사 목록
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase()) && !event.location.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (showCosplayOnly && event.allowsCosplay === 'no') return false;
      return true;
    });
  }, [events, searchTerm, showCosplayOnly]);

  const handleEventClick = (eventId: number) => {
    setLocation(`/event/${eventId}` as string);
  };

  const handleAdminClick = () => {
    setLocation("/admin" as string);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">동인 행사 일정</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user?.role === "admin" && (
              <Button
                onClick={handleAdminClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                관리자 패널
              </Button>
            )}
            {isAuthenticated && (
              <div className="text-sm text-muted-foreground">
                {user?.name || "사용자"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container py-12">
        {/* 검색 및 필터 섹션 */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-foreground mb-2">
              행사를 찾아보세요
            </h2>
            <p className="text-muted-foreground">
              서울코믹월드, 일러스타페스 등 주요 동인 행사의 일정을 한눈에 확인하세요
            </p>
          </div>

          {/* 검색 입력 및 코스프레 필터 */}
          <div className="mb-6 flex flex-col gap-4">
            <Input
              placeholder="행사명, 장소명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md"
            />
            <Button
              variant={showCosplayOnly ? "default" : "outline"}
              onClick={() => setShowCosplayOnly(!showCosplayOnly)}
              className="w-fit"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <Card
                  key={event.id}
                  className="event-card cursor-pointer group"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="event-card-header">
                    <h3 className="event-card-title group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="event-card-meta">
                    <div className="event-card-meta-item">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(event.eventDate), "MMM dd, yyyy", { locale: ko })}
                      </span>
                    </div>
                    <div className="event-card-meta-item">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-3">
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
