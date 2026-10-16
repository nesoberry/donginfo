import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  MessagesSquare,
  Shirt,
  Camera,
  ImageDown,
  MapPin,
  Scissors,
  Sparkles,
  Check,
  Minus,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

// 코스프레 사업 수요 검증 랜딩페이지 (/package)
// 가격 범위 근거: goals/5-1000/hidden_files/가격-리서치-2026-10-13.md (2026-10-13 실측)
// 풀패키지 국내 상품 없음 → 부품 대표 구간 합산 (25만~47만원, 시장 실측가 아님을 고지)

const INTERESTS = [
  { id: "full", label: "풀패키지" },
  { id: "studio", label: "스튜디오" },
  { id: "photographer", label: "사진사" },
  { id: "costume", label: "의상·가발" },
  { id: "makeup", label: "메이크업" },
] as const;

const STEPS = [
  {
    icon: MessagesSquare,
    title: "상담",
    desc: "하고 싶은 캐릭터와 일정을 이야기합니다. 필요한 것만 골라도 됩니다.",
  },
  {
    icon: Shirt,
    title: "준비",
    desc: "의상·가발·메이크업을 캐릭터에 맞게 준비합니다.",
  },
  {
    icon: Camera,
    title: "촬영 당일",
    desc: "스튜디오에서 사진사와 함께 촬영합니다. 몸만 오세요.",
  },
  {
    icon: ImageDown,
    title: "보정 사진 수령",
    desc: "보정된 사진을 받아 SNS에 올리면 끝입니다.",
  },
];

const PACKAGE_ITEMS = [
  "의상·가발 대여 및 세팅",
  "캐릭터 메이크업",
  "스튜디오 대관",
  "전문 사진사 촬영",
  "보정 사진 제공",
];

const PARTIALS = [
  {
    icon: MapPin,
    name: "스튜디오 찾기",
    desc: "의상은 있는데 찍을 곳을 모르는 분",
    price: "시간당 2만~3만원",
  },
  {
    icon: Camera,
    name: "사진사",
    desc: "장소는 아는데 찍어줄 사람이 없는 분",
    price: "시간당 6만~20만원",
  },
  {
    icon: Shirt,
    name: "의상 대여",
    desc: "캐릭터는 정했는데 의상 준비가 부담인 분",
    price: "2만~3만원",
  },
  {
    icon: Scissors,
    name: "가발",
    desc: "가발 준비·세팅이 어려운 분",
    price: "1만~3만원",
  },
  {
    icon: Sparkles,
    name: "메이크업",
    desc: "메이크업만 전문가에게 맡기고 싶은 분",
    price: "12만원",
  },
];

const BUDGETS = [
  { value: "", label: "아직 모름" },
  { value: "under30", label: "30만원 이하" },
  { value: "30-50", label: "30만~50만원" },
  { value: "50-70", label: "50만~70만원" },
  { value: "over70", label: "70만원 이상" },
];

const SOLO_PAIN = [
  "의상·가발을 각각 구하고 직접 세팅",
  "메이크업을 혼자 익혀야 함",
  "스튜디오와 사진사를 따로 섭외하고 일정 조율",
];

const DELEGATE_EASE = [
  "신청 한 번으로 준비 완료",
  "촬영 당일 몸만 오면 됨",
  "일정은 상담으로 조율",
];

const FAQS = [
  {
    q: "사전 신청하면 바로 결제하나요?",
    a: "아닙니다. 사전 신청은 정식 오픈 안내를 받기 위한 접수입니다. 결제는 오픈 후 상담을 거쳐 진행됩니다.",
  },
  {
    q: "어떤 캐릭터든 가능한가요?",
    a: "신청할 때 하고 싶은 캐릭터를 적어주세요. 가능 여부는 상담 때 확인해드립니다.",
  },
  {
    q: "부분 서비스만 신청할 수 있나요?",
    a: "네. 스튜디오, 사진사, 의상 대여, 가발, 메이크업 중 필요한 항목만 선택할 수 있습니다.",
  },
  {
    q: "가격이 왜 범위인가요?",
    a: "캐릭터와 일정에 따라 준비 내용이 달라지기 때문입니다. 최종 금액은 상담 후 확정됩니다.",
  },
  {
    q: "언제부터 이용할 수 있나요?",
    a: "현재 사전 신청 접수 중입니다. 정식 오픈 시 신청 순서대로 우선 안내드립니다.",
  },
];

export default function PackagePage() {
  const [, setLocation] = useLocation();
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [showCta, setShowCta] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  usePageMeta({
    title: "코스프레 풀패키지 사전 신청 | 동인행사 알리미",
    description:
      "코스프레, 몸만 오세요. 의상·가발·메이크업부터 스튜디오·사진사·보정까지 전부 준비해드립니다. 전부 맡기거나 필요한 것만 골라도 됩니다. 현재 사전 신청 접수 중.",
  });

  const [contact, setContact] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [character, setCharacter] = useState("");
  const [timing, setTiming] = useState("");
  const [budget, setBudget] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [consent, setConsent] = useState(false);

  // 모바일 스티키 CTA: 폼이 화면에 없을 때만 표시
  useEffect(() => {
    const formEl = formRef.current;
    const heroEl = heroRef.current;
    if (!formEl || !heroEl) return;
    let formVisible = false;
    let heroVisible = false;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === formEl) formVisible = entry.isIntersecting;
          if (entry.target === heroEl) heroVisible = entry.isIntersecting;
        }
        setShowCta(!formVisible && !heroVisible);
      },
      { threshold: 0 }
    );
    obs.observe(formEl);
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);

  const apply = trpc.packageApplications.create.useMutation({
    onSuccess: () => {
      setSucceeded(true);
      setErrorMsg("");
    },
    onError: (error) => {
      setErrorMsg(error.message || "신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    },
  });

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apply.isPending) return;

    const trimmed = contact.trim();
    if (trimmed.length < 3) {
      setErrorMsg("연락처(이메일 또는 휴대폰 번호)를 입력해주세요.");
      return;
    }
    if (interests.length === 0) {
      setErrorMsg("관심 있는 항목을 하나 이상 선택해주세요.");
      return;
    }
    if (!consent) {
      setErrorMsg("개인정보 수집·이용에 동의해주세요.");
      return;
    }

    apply.mutate({
      contact: trimmed,
      interests,
      character: character.trim() || null,
      timing: timing.trim() || null,
      budget: budget || null,
    });
  };

  const scrollToForm = () => {
    const el = formRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .pkg-acc-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms cubic-bezier(0.22, 1, 0.36, 1); }
        .pkg-acc-panel[data-open="true"] { grid-template-rows: 1fr; }
        .pkg-acc-panel > div { overflow: hidden; min-height: 0; }
        .pkg-acc-chevron { transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1); }
        .pkg-acc-chevron[data-open="true"] { transform: rotate(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .pkg-acc-panel, .pkg-acc-chevron { transition-duration: 1ms; }
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로
          </Button>
          <h1 className="text-base font-semibold text-foreground">코스프레 풀패키지</h1>
        </div>
      </header>

      <main className="pb-24 md:pb-0">
        {/* 1. 히어로 */}
        <section ref={heroRef} className="bg-primary/[0.04]">
          <div className="container px-4 max-w-6xl mx-auto grid gap-10 md:grid-cols-2 md:items-center py-14 md:py-20">
            <div>
              <p className="text-sm font-semibold text-primary mb-4">사전 신청 접수 중</p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
                몸만 오세요.
                <br />
                나머지는 다 준비해드립니다.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-xl">
                코스프레를 처음 해도 괜찮습니다. 의상·가발·메이크업부터
                스튜디오·사진사·보정까지, 전부 맡겨도 되고 필요한 것만 골라도 됩니다.
              </p>
              <p className="text-2xl font-bold text-primary mb-8 tabular-nums">
                코스프레 풀패키지 25만원부터
              </p>
              <Button
                size="lg"
                onClick={scrollToForm}
                className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90"
              >
                사전 신청하기
                <ArrowDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div>
              <img
                src="/images/package-hero.webp"
                alt="코스프레 촬영 현장 일러스트 — 코스어, 사진사, 메이크업 아티스트"
                className="w-full aspect-square object-cover rounded-2xl"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* 2. 문제 제기: 혼자 준비하면 vs 맡기면 */}
        <section className="bg-background">
          <div className="container px-4 max-w-5xl mx-auto py-14 md:py-20">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8 md:mb-10">
              처음이면, 준비가 제일 막막합니다
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-base font-semibold text-foreground mb-5">혼자 준비하면</p>
                <ul className="flex flex-col gap-4">
                  {SOLO_PAIN.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Minus className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden />
                      <span className="text-base text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted/50 rounded-2xl p-6 md:p-8">
                <p className="text-base font-semibold text-foreground mb-5">맡기면</p>
                <ul className="flex flex-col gap-4">
                  {DELEGATE_EASE.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
                      <span className="text-base text-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 진행 방식 4단계 */}
        <section className="bg-muted/40">
          <div className="container px-4 max-w-6xl mx-auto py-14 md:py-20">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8 md:mb-10">
              이렇게 진행됩니다
            </h3>
            <ol className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="contents">
                  <li className="bg-card rounded-2xl p-6 flex-1 flex gap-4">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <step.icon className="w-6 h-6 text-primary" aria-hidden />
                      <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                  {i < STEPS.length - 1 && (
                    <>
                      <ArrowDown
                        className="w-5 h-5 text-muted-foreground self-center mx-auto lg:hidden"
                        aria-hidden
                      />
                      <ArrowRight
                        className="w-5 h-5 text-muted-foreground self-center hidden lg:block flex-shrink-0"
                        aria-hidden
                      />
                    </>
                  )}
                </div>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. 가격 */}
        <section className="bg-background">
          <div className="container px-4 max-w-5xl mx-auto py-14 md:py-20">
            {/* 풀패키지 강조 카드 */}
            <div className="rounded-2xl bg-primary/[0.05] border border-primary/20 p-6 md:p-10 mb-10 md:mb-12">
              <p className="text-base font-semibold text-foreground mb-1">풀패키지</p>
              <p className="text-sm text-muted-foreground mb-6">
                하나하나 알아볼 필요 없이, 한 번에 해결됩니다.
              </p>
              <ul className="flex flex-col gap-4 mb-8">
                {PACKAGE_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" aria-hidden />
                    <span className="text-base text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-4xl md:text-5xl font-bold text-primary tabular-nums mb-4">
                예상 25만~47만원
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                캐릭터와 일정에 따라 달라질 수 있으며,
                사전 신청 후 상담을 통해 최종 금액이 확정됩니다.
              </p>
            </div>

            {/* 부분 서비스 */}
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              필요한 것만 골라서
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              풀패키지가 부담되면, 필요한 부분만 이용할 수 있습니다.
            </p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARTIALS.map((p) => (
                <li key={p.name} className="bg-muted/50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <p.icon className="w-5 h-5 text-primary flex-shrink-0" aria-hidden />
                    <p className="text-base font-semibold text-foreground">{p.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
                  <p className="text-base font-bold text-foreground tabular-nums">{p.price}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. FAQ */}
        <section className="bg-muted/40">
          <div className="container px-4 max-w-3xl mx-auto py-14 md:py-20">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8">
              자주 묻는 질문
            </h3>
            <div>
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                const panelId = `package-faq-panel-${i}`;
                const buttonId = `package-faq-button-${i}`;
                return (
                  <div key={faq.q} className="border-b border-border last:border-b-0">
                    <h4>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                      >
                        <span className="text-base font-semibold text-foreground">{faq.q}</span>
                        <ChevronDown
                          className="pkg-acc-chevron w-5 h-5 text-muted-foreground flex-shrink-0"
                          data-open={open}
                          aria-hidden
                        />
                      </button>
                    </h4>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="pkg-acc-panel"
                      data-open={open}
                    >
                      <div>
                        <p className="text-sm text-muted-foreground leading-relaxed pb-6 pr-8">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. 사전 신청 폼 */}
        <section ref={formRef} className="bg-primary/[0.04] scroll-mt-20">
          <div className="container px-4 max-w-3xl mx-auto py-14 md:py-20">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">사전 신청하기</h3>
            <p className="text-sm text-muted-foreground mb-8">
              정식 오픈 시 신청 순서대로 우선 안내드립니다.
            </p>

            {succeeded ? (
              <div
                role="status"
                className="flex items-start gap-3 py-6"
              >
                <CircleCheck className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">
                    신청이 접수되었습니다.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    남겨주신 연락처로 정식 오픈 시 안내드리겠습니다. 감사합니다.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                <div>
                  <label
                    htmlFor="package-contact"
                    className="text-sm font-semibold text-foreground mb-2 block"
                  >
                    연락처 (이메일 또는 휴대폰) *
                  </label>
                  <Input
                    id="package-contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="예: name@example.com 또는 010-0000-0000"
                    className="h-12 text-base"
                    autoComplete="email"
                  />
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold text-foreground mb-3">
                    관심 있는 항목 * (여러 개 선택 가능)
                  </legend>
                  <div className="flex flex-col gap-1">
                    {INTERESTS.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 py-2 cursor-pointer min-h-[44px]"
                      >
                        <Checkbox
                          checked={interests.includes(item.id)}
                          onCheckedChange={() => toggleInterest(item.id)}
                          className="mt-1"
                        />
                        <span className="text-base text-foreground">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor="package-character"
                    className="text-sm font-semibold text-foreground mb-2 block"
                  >
                    하고 싶은 캐릭터·작품
                  </label>
                  <Input
                    id="package-character"
                    type="text"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="예: 원신 라이덴 쇼군 (정하지 않았으면 비워두세요)"
                    className="h-12 text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="package-timing"
                      className="text-sm font-semibold text-foreground mb-2 block"
                    >
                      희망 시기
                    </label>
                    <Input
                      id="package-timing"
                      type="text"
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      placeholder="예: 11월 중, 내년 1월"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="package-budget"
                      className="text-sm font-semibold text-foreground mb-2 block"
                    >
                      예산대
                    </label>
                    <select
                      id="package-budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full h-12 px-3 text-base border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {BUDGETS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border border-border rounded-md p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    [필수] 개인정보 수집·이용 동의
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground leading-relaxed space-y-1 mb-2">
                    <li>수집 목적: 사전 신청 접수, 정식 오픈 안내, 상담 연락</li>
                    <li>수집 항목: 연락처(이메일 또는 휴대폰 번호), 관심 항목, 하고 싶은 캐릭터·작품, 희망 시기, 예산대</li>
                    <li>보유 기간: 정식 오픈 안내 후 6개월까지. 그 전에 삭제를 요청하면 바로 삭제합니다.</li>
                    <li>동의를 거부할 수 있으며, 거부하면 사전 신청을 할 수 없습니다.</li>
                    <li>
                      자세한 내용은{" "}
                      <a href="/privacy" className="text-primary underline">
                        개인정보처리방침
                      </a>
                      을 확인해 주세요.
                    </li>
                  </ul>
                  <label className="flex items-start gap-3 py-2 cursor-pointer min-h-[44px]">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={() => setConsent((v) => !v)}
                      className="mt-1"
                    />
                    <span className="text-base text-foreground">위 내용에 동의합니다.</span>
                  </label>
                </div>

                {errorMsg && (
                  <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                    <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                    {errorMsg}
                  </p>
                )}

                <div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={apply.isPending}
                    className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {apply.isPending && <Spinner className="w-4 h-4 mr-2" />}
                    신청하기
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* 7. 안내 문구 */}
        <section className="bg-background">
          <div className="container px-4 max-w-5xl mx-auto py-12">
            <p className="text-sm text-muted-foreground leading-relaxed">
              현재 사전 신청 접수 중입니다. 정식 오픈 시 신청 순서대로 우선 안내드립니다.
            </p>
          </div>
        </section>
      </main>

      {/* 모바일 스티키 하단 CTA */}
      {showCta && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
          <div
            className="bg-card/95 border-t border-border px-4 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <Button
              size="lg"
              onClick={scrollToForm}
              className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
            >
              사전 신청하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
