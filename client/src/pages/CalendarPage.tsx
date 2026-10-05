import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ChevronRight, Home, ChevronRight as ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function CalendarPage() {
  usePageMeta({
    title: "동인 행사 캘린더 | 동인 행사 알리미",
    description:
      "월별 캘린더로 보는 전국 동인행사 일정. 코믹월드, 일러스타페스, 온리전 등 서브컬처 행사 날짜를 한눈에 확인하세요.",
  });
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = trpc.events.list.useQuery({});

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startOffset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const d = new Date(event.eventDate);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  const prevMonth = () => {
    setSelectedDate(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  const nextMonth = () => {
    setSelectedDate(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayClick = (day: Date) => {
    if (selectedDate && isSameDay(day, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7f8fb]">
        <p className="text-muted-foreground">행사 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f7f8fb] text-[#172033]">
      {/* 헤더 */}
      <header className="shrink-0 border-b border-[#dde5ef] bg-white/95 px-6 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:px-8">
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => setLocation('/')}
              className="mt-1 grid size-10 place-items-center rounded-full border border-violet-100 bg-violet-50/80 text-violet-700 transition hover:bg-violet-100 hover:shadow-sm active:scale-95"
              aria-label="홈으로 이동"
            >
              <Home className="size-5" />
            </button>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600/80">
                Dongin Schedule
              </p>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                동인 행사 캘린더
              </h1>
              <p className="mt-1 text-sm text-[#697386]">
                다가오는 동인 행사와 이벤트를 확인하세요
              </p>
            </div>
          </div>

          <nav
            className="flex w-fit items-center gap-1 rounded-full border border-violet-100 bg-violet-50/80 p-1 shadow-[0_10px_30px_rgba(124,58,237,0.12)] sm:absolute sm:left-1/2 sm:-translate-x-1/2"
            aria-label="월 이동"
          >
            <button
              onClick={prevMonth}
              className="grid size-9 place-items-center rounded-full text-violet-700 transition hover:bg-white hover:shadow-sm active:scale-95"
              aria-label="이전 달"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="min-w-36 rounded-full bg-white px-5 py-2 text-center text-sm font-bold text-violet-900 shadow-sm ring-1 ring-violet-100">
              {monthYear}
            </div>
            <button
              onClick={nextMonth}
              className="grid size-9 place-items-center rounded-full text-violet-700 transition hover:bg-white hover:shadow-sm active:scale-95"
              aria-label="다음 달"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* 캘린더 영역 */}
      {/* 모바일: 스크롤 가능 / PC: 화면 꽉 채움 */}
      <section className="min-h-0 flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto sm:overflow-hidden">

        <div className="grid grid-rows-[30px_1fr] sm:h-full shrink-0 sm:shrink rounded-[1.35rem] border border-[#dde5ef] bg-white shadow-[0_18px_60px_rgba(19,24,38,0.08)] overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-[#dde5ef] bg-[#eef3f8]/60">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`flex items-center justify-center text-[11px] font-bold ${
                  index === 0 ? 'text-rose-500' : index === 6 ? 'text-blue-500' : 'text-[#697386]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 grid-rows-6">
            {calendarDays.map((day) => {
              const inMonth = day.getMonth() === currentDate.getMonth();
              const dayEvents = getEventsForDate(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const dotCount = Math.min(dayEvents.length, 3);

              return (
                <article
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-0 border-r border-b border-[#dde5ef]/90 last:border-r-0 flex flex-col cursor-pointer transition-colors
                    p-1 sm:p-2
                    ${isSelected ? 'bg-violet-50 sm:bg-transparent' : 'hover:bg-[#f7f8fb]'}
                  `}
                >
                  {/* 날짜 숫자 */}
                  <div className="mb-1 flex h-7 sm:h-8 shrink-0 items-center justify-center">
                    <span
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[13px] sm:text-[15px] font-bold leading-none transition-colors ${
                        isToday
                          ? 'bg-violet-600 text-white'
                          : isSelected
                          ? 'bg-violet-100 text-violet-700 sm:bg-transparent sm:text-[#172033]/75'
                          : inMonth
                          ? 'text-[#172033]/75'
                          : 'text-[#697386]/45'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* 모바일: 도트 표시 */}
                  {dotCount > 0 && (
                    <div className="flex gap-[3px] justify-center sm:hidden">
                      {Array.from({ length: dotCount }).map((_, i) => (
                        <div key={i} className="w-[5px] h-[5px] rounded-full bg-violet-500" />
                      ))}
                    </div>
                  )}

                  {/* PC: 텍스트 뱃지 */}
                  <div className="hidden sm:block space-y-1 overflow-hidden leading-tight">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/event/${event.id}`);
                        }}
                        className="flex min-h-[29px] cursor-pointer items-center truncate rounded-md bg-violet-600 px-2 py-1.5 text-[15px] font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 lg:min-h-[43px] xl:min-h-[48px]"
                        title={event.name}
                      >
                        {event.name}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="px-2 text-[11px] font-semibold text-[#697386]">
                        +{dayEvents.length - 3}개
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* 하단 패널: 모바일 전용 */}
        <div className="sm:hidden shrink-0">
          {selectedDate ? (
            <div className="rounded-[1.35rem] border border-[#dde5ef] bg-white shadow-[0_18px_60px_rgba(19,24,38,0.08)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dde5ef] bg-[#eef3f8]/60">
                <p className="text-sm font-bold text-violet-900">
                  {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
                </p>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#697386]">
                  이 날에는 행사가 없습니다
                </div>
              ) : (
                <ul>
                  {selectedEvents.map((event, idx) => (
                    <li
                      key={event.id}
                      onClick={() => setLocation(`/event/${event.id}`)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-violet-50 transition-colors ${
                        idx < selectedEvents.length - 1 ? 'border-b border-[#dde5ef]/70' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                      <span className="flex-1 text-sm font-semibold text-[#172033]">
                        {event.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#697386] shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-[#697386] py-2">
              날짜를 탭하면 행사 목록을 볼 수 있어요
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
