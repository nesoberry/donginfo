import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로
          </Button>
          <h1 className="text-base font-semibold text-foreground">개인정보처리방침</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">

          <p className="text-muted-foreground text-sm mb-6">
            동인 행사 알리미(이하 "서비스")는 「개인정보 보호법」 등 관련 법령을 준수하며,
            이용자의 개인정보를 보호하기 위해 다음과 같은 개인정보처리방침을 두고 있습니다.
            <br />본 방침은 2026년 6월 5일부터 적용됩니다.
          </p>

          <Section title="1. 수집하는 개인정보 항목">
            <p className="mb-2">서비스는 회원 식별 및 알림 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
            <p className="font-medium mb-1">가. 구글(Google) 계정 로그인 시 수집 항목</p>
            <ul className="list-disc list-inside mb-3 text-sm text-muted-foreground space-y-1">
              <li>이메일 주소</li>
              <li>이름(닉네임)</li>
              <li>구글 계정 고유 식별자</li>
            </ul>
            <p className="font-medium mb-1">나. 서비스 이용 과정에서 생성·수집되는 정보</p>
            <ul className="list-disc list-inside mb-3 text-sm text-muted-foreground space-y-1">
              <li>알림 설정(알림 수신 방식, 수신 여부 등)</li>
              <li>구독한 행사 정보</li>
              <li>서비스 이용 기록, 접속 일시</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              서비스는 사상·신념, 정치적 견해, 건강, 성생활 등에 관한 민감정보는 수집하지 않습니다.
            </p>
          </Section>

          <Section title="2. 개인정보의 수집 및 이용 목적">
            <p className="mb-2">수집한 개인정보는 다음의 목적으로만 이용됩니다.</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>회원 식별 및 로그인 기능 제공</li>
              <li>이용자가 구독한 동인 행사의 예매 오픈·일정 관련 알림 발송</li>
              <li>서비스 운영, 문의 응대 및 개선</li>
              <li>부정 이용 방지 및 서비스 보안 유지</li>
            </ul>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>서비스는 원칙적으로 이용자가 회원 탈퇴를 요청하거나 수집·이용 목적이 달성된 경우 지체 없이 해당 정보를 파기합니다.</li>
              <li>단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다.</li>
              <li>장기간(예: 1년 이상) 서비스를 이용하지 않은 이용자의 정보는 별도 보관하거나 파기할 수 있습니다.</li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p className="text-sm text-muted-foreground mb-2">
              서비스는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 따라 수사기관 등이 적법한 절차에 따라 요청하는 경우</li>
            </ul>
          </Section>

          <Section title="5. 개인정보 처리의 위탁">
            <p className="text-sm text-muted-foreground mb-3">
              서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리 업무의 일부를 외부 전문업체에 위탁할 수 있습니다.
            </p>
            <div className="border border-border rounded-md overflow-hidden text-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-2 font-medium text-foreground">수탁업체</th>
                    <th className="text-left px-4 py-2 font-medium text-foreground">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">Google LLC</td>
                    <td className="px-4 py-2 text-muted-foreground">로그인 인증(OAuth)</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">Vercel Inc.</td>
                    <td className="px-4 py-2 text-muted-foreground">프론트엔드 호스팅 및 서버 운영</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">Railway Corp.</td>
                    <td className="px-4 py-2 text-muted-foreground">백엔드 서버 운영 및 데이터베이스 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              위탁계약 시 개인정보가 안전하게 관리될 수 있도록 관련 사항을 규정하고 있습니다.
              향후 위탁 업무 또는 수탁업체가 변경될 경우 본 방침을 통해 공개합니다.
            </p>
          </Section>

          <Section title="6. 정보주체의 권리·의무 및 행사 방법">
            <p className="text-sm text-muted-foreground mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-2">
              <li>개인정보 열람 요청</li>
              <li>오류 등이 있을 경우 정정 요청</li>
              <li>삭제 요청</li>
              <li>처리 정지 요청</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              위 권리는 아래 운영자 연락처를 통해 요청하실 수 있으며, 서비스는 지체 없이 조치합니다.
              회원 탈퇴를 원하시는 경우에도 동일하게 요청하실 수 있습니다.
            </p>
          </Section>

          <Section title="7. 개인정보의 파기 절차 및 방법">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><span className="font-medium text-foreground">파기 절차:</span> 수집·이용 목적이 달성된 개인정보는 지체 없이 파기합니다.</li>
              <li><span className="font-medium text-foreground">파기 방법:</span> 전자적 파일 형태의 정보는 복구가 불가능한 방법으로 영구 삭제합니다.</li>
            </ul>
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            <p className="text-sm text-muted-foreground mb-2">서비스는 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>개인정보에 대한 접근 권한 제한</li>
              <li>비밀번호 등 인증정보의 암호화 처리</li>
              <li>보안 통신(HTTPS) 적용</li>
              <li>접근 기록의 보관</li>
            </ul>
          </Section>

          <Section title="9. 쿠키 등 자동 수집 장치의 운영">
            <p className="text-sm text-muted-foreground">
              서비스는 로그인 상태 유지 등을 위해 쿠키(cookie)를 사용할 수 있습니다.
              이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며,
              이 경우 로그인 등 일부 기능 이용에 제한이 있을 수 있습니다.
            </p>
          </Section>

          <Section title="10. 개인정보 보호책임자 및 연락처">
            <p className="text-sm text-muted-foreground mb-1">
              개인정보 처리에 관한 문의, 불만, 권리 행사는 아래로 연락해 주시기 바랍니다.
            </p>
            <ul className="list-none text-sm text-muted-foreground space-y-1">
              <li><span className="font-medium text-foreground">운영자(개인정보 보호책임자):</span> 동인 행사 알리미 운영자</li>
              <li>
                <span className="font-medium text-foreground">이메일:</span>{" "}
                <a href="mailto:nesoberry8@gmail.com" className="text-primary underline">
                  nesoberry8@gmail.com
                </a>
              </li>
            </ul>
          </Section>

          <Section title="11. 권익침해 구제 방법">
            <p className="text-sm text-muted-foreground mb-2">
              개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>개인정보분쟁조정위원회 (privacy.go.kr / 국번없이 1833-6972)</li>
              <li>개인정보침해신고센터 (privacy.go.kr / 국번없이 118)</li>
              <li>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
              <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
            </ul>
          </Section>

          <Section title="12. 개인정보처리방침의 변경">
            <p className="text-sm text-muted-foreground mb-2">
              본 개인정보처리방침은 법령·정책 또는 서비스 내용의 변경에 따라 수정될 수 있으며,
              변경 시 서비스 내 공지를 통해 안내합니다.
            </p>
            <ul className="list-none text-sm text-muted-foreground space-y-1">
              <li><span className="font-medium text-foreground">공고일자:</span> 2026년 6월 5일</li>
              <li><span className="font-medium text-foreground">시행일자:</span> 2026년 6월 5일</li>
            </ul>
          </Section>

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
