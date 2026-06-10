import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    location: "",
    ticketOpenDate: "",
    ticketLink: "",
    mapLink: "",
    region: "",
    allowsCosplay: "no" as "yes" | "no" | "limited",
  });

  // 행사 목록 조회
  const { data: events = [], isLoading, refetch } = trpc.events.list.useQuery({});

  // 행사 생성
  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("행사가 등록되었습니다");
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "행사 등록 중 오류가 발생했습니다");
    },
  });

  // 행사 수정
  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("행사가 수정되었습니다");
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "행사 수정 중 오류가 발생했습니다");
    },
  });

  // 행사 삭제
  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("행사가 삭제되었습니다");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "행사 삭제 중 오류가 발생했습니다");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      eventDate: "",
      location: "",
      ticketOpenDate: "",
      ticketLink: "",
      mapLink: "",
      region: "",
      allowsCosplay: "no",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (event: typeof events[0]) => {
    setFormData({
      name: event.name,
      description: event.description || "",
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd'T'HH:mm"),
      location: event.location,
      ticketOpenDate: format(new Date(event.ticketOpenDate), "yyyy-MM-dd'T'HH:mm"),
      ticketLink: event.ticketLink || "",
      mapLink: event.mapLink || "",
      region: event.region || "",
      allowsCosplay: (event.allowsCosplay as "yes" | "no" | "limited") || "no",
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.eventDate || !formData.ticketOpenDate) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      eventDate: new Date(formData.eventDate),
      location: formData.location,
      ticketOpenDate: new Date(formData.ticketOpenDate),
      ticketLink: formData.ticketLink || undefined,
      mapLink: formData.mapLink || undefined,
      region: formData.region || undefined,
      allowsCosplay: formData.allowsCosplay,
    };

    if (editingId) {
      updateEvent.mutate({ id: editingId, ...payload });
    } else {
      createEvent.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("정말 이 행사를 삭제하시겠습니까?")) {
      deleteEvent.mutate({ id });
    }
  };

  // 어드민 권한 확인
  if (user?.role !== "admin") {
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
            <p className="text-muted-foreground text-lg">
              어드민 권한이 필요합니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">관리자 패널</h1>
          </div>
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
      <main className="container py-12">
        {/* 행사 등록 폼 */}
        {showForm && (
          <Card className="event-card p-8 mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              {editingId ? "행사 수정" : "새 행사 등록"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    행사명 *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 서울코믹월드 330"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    지역
                  </label>
                  <Input
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    placeholder="예: 서울, 부산"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    장소 *
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="예: KINTEX 제1전시장"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    행사 날짜 *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    예매 오픈 일시 *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.ticketOpenDate}
                    onChange={(e) =>
                      setFormData({ ...formData, ticketOpenDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    예매처 링크
                  </label>
                  <Input
                    type="url"
                    value={formData.ticketLink}
                    onChange={(e) =>
                      setFormData({ ...formData, ticketLink: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    배치도 링크
                  </label>
                  <Input
                    type="url"
                    value={formData.mapLink}
                    onChange={(e) =>
                      setFormData({ ...formData, mapLink: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  코스프레 허용 여부
                </label>
                <select
                  value={formData.allowsCosplay}
                  onChange={(e) =>
                    setFormData({ ...formData, allowsCosplay: e.target.value as "yes" | "no" | "limited" })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="no">불가</option>
                  <option value="yes">가능</option>
                  <option value="limited">제한적 허용</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="행사에 대한 설명을 입력하세요"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createEvent.isPending || updateEvent.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {createEvent.isPending || updateEvent.isPending ? (
                    <Spinner className="w-4 h-4 mr-2" />
                  ) : null}
                  {editingId ? "수정하기" : "등록하기"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  취소
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 행사 목록 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              등록된 행사 ({events.length})
            </h2>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 행사 등록
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                등록된 행사가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <Card key={event.id} className="event-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {event.name}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(event.eventDate), "MMM dd, yyyy", {
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div>
                          <span className="font-semibold">예매 오픈:</span>{" "}
                          {format(new Date(event.ticketOpenDate), "MMM dd, HH:mm", {
                            locale: ko,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event.id)}
                        disabled={deleteEvent.isPending}
                      >
                        {deleteEvent.isPending ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
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
