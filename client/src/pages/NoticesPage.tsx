import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// ✏️ 업데이트 내역을 여기에 추가하세요.
// 최신 항목을 배열 맨 위에 추가하면 됩니다.
const NOTICES = [
  {
    date: "2026-06-11",
    title: "서비스 오픈",
    content: [
      "동인 행사 알리미 서비스를 정식으로 시작했습니다.",
      "행사 일정 조회, 구독, 알림 기능을 이용할 수 있습니다.",
      "구글 계정으로 로그인 후 관심 행사를 구독하면 예매 오픈 알림을 받을 수 있습니다.",
    ],
  },
];

export default function NoticesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로
          </Button>
          <h1 className="text-base font-semibold text-foreground">공지 / 업데이트 내역</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto">
        <p className="text-sm text-muted-foreground mb-6">
          서비스 업데이트, 기능 추가, 정책 변경 등 주요 내용을 확인할 수 있습니다.
        </p>

        <div className="flex flex-col gap-4">
          {NOTICES.map((notice, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{notice.date}</span>
              </div>
              <h2 className="text-base font-semibold text-foreground mb-3">
                {notice.title}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {notice.content.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
