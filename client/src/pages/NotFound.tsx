import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          주소가 잘못되었거나 페이지가 삭제되었습니다.
        </p>

        <Button
          onClick={() => setLocation("/")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Home className="w-4 h-4 mr-2" />
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
