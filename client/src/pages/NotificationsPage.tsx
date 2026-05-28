import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Bell, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: notifications, isLoading, error } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && !authLoading }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold text-center mb-2">로그인 필요</h2>
          <p className="text-center text-gray-600 mb-4">
            알림을 보려면 로그인해주세요.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-center mb-2">오류 발생</h2>
          <p className="text-center text-gray-600">
            알림을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">알림</h1>
          </div>
          <p className="text-gray-600">
            예매 오픈 알림 및 행사 관련 알림을 확인하세요.
          </p>
        </div>

        {!notifications || notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">알림이 없습니다</h2>
            <p className="text-gray-600 mb-6">
              행사를 구독하면 예매 오픈 알림을 받을 수 있습니다.
            </p>
            <Button variant="default" onClick={() => window.location.href = "/"}>
              행사 보기
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                      <Bell className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {notification.notificationType === "email" ? "이메일 알림" : "인앱 알림"}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">
                      {notification.triggerType === "one_day_before"
                        ? "예매 1일 전 알림"
                        : "예매 1시간 전 알림"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {notification.sentAt
                        ? formatDistanceToNow(new Date(notification.sentAt), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : "발송 대기 중"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {notification.status === "sent" ? "발송됨" : notification.status === "failed" ? "실패" : "대기 중"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
