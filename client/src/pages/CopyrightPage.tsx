import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CopyrightPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로
          </Button>
          <h1 className="text-base font-semibold text-foreground">저작권 및 면책사항</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto">
        <div className="text-foreground">

          <Section title="1. 서비스의 성격">
            <p className="text-sm text-muted-foreground mb-2">
              동인 행사 알리미(이하 "서비스")는 서울코믹월드, 일러스타페스 등 주요 동인 행사의
              일정·장소·예매 정보를 한곳에 모아 제공하는 <span className="font-medium text-foreground">정보 제공 서비스</span>입니다.
            </p>
            <p className="text-sm text-muted-foreground">
              본 서비스는 개별 행사의 주최자가 아니며, 행사 운영·예매·취소 등과 직접적인 관련이 없습니다.
            </p>
          </Section>

          <Section title="2. 행사 정보에 관한 책임">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>
                서비스에 게시된 모든 행사 정보(명칭, 일정, 장소, 예매 일시, 이미지 등)의 저작권 및 법적 책임은{" "}
                <span className="font-medium text-foreground">각 행사의 주최자 및 해당 권리자</span>에게 있습니다.
              </li>
              <li>
                서비스는 정확한 정보 제공을 위해 노력하나, 행사 일정 변경·예매 취소·정보 오류 등으로 인해
                발생하는 손해에 대해 책임을 지지 않습니다.
              </li>
              <li>
                행사의 일정 변경, 예매, 취소 등에 관한 정확한 내용은{" "}
                <span className="font-medium text-foreground">각 행사의 공식 홈페이지 또는 공식 채널</span>을 통해
                반드시 확인하시기 바랍니다.
              </li>
            </ul>
          </Section>

          <Section title="3. 저작권">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>
                서비스가 직접 제작한 화면 구성, 디자인, 텍스트 등에 대한 저작권은 서비스 운영자에게 있습니다.
              </li>
              <li>
                서비스에 포함된 외부 행사 정보 및 이미지의 저작권은 각 권리자에게 있으며,
                서비스는 정보 안내 목적으로 이를 인용·표시합니다.
              </li>
              <li>
                권리자께서 게시 중단을 요청하시는 경우, 아래 연락처로 알려주시면 신속히 조치하겠습니다.
              </li>
            </ul>
          </Section>

          <Section title="4. 게시 중단 및 정보 수정 요청">
            <p className="text-sm text-muted-foreground mb-2">
              게시된 정보에 오류가 있거나, 권리자로서 정보의 수정·삭제를 원하시는 경우 아래로 연락해 주시기 바랍니다.
            </p>
            <ul className="list-none text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">이메일:</span>{" "}
                <a href="mailto:nesoberry8@gmail.com" className="text-primary underline">
                  nesoberry8@gmail.com
                </a>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              요청 확인 후 정당한 사유가 인정되는 경우 지체 없이 조치합니다.
            </p>
          </Section>

          <Section title="5. 면책">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>서비스는 무료로 제공되며, 정보의 완전성·정확성·최신성을 보장하지 않습니다.</li>
              <li>이용자가 서비스의 정보를 신뢰하여 행한 모든 행위의 결과에 대한 책임은 이용자 본인에게 있습니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            </ul>
          </Section>

          <p className="text-xs text-muted-foreground mt-8 pt-4 border-t border-border">
            본 사항은 2026년 6월 5일부터 적용됩니다.
          </p>

        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}
