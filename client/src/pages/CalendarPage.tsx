import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date()); // 현재 날짜 기반 초기화
  const [, setLocation] = useLocation();

  // 행사 목록 조회
  const { data: events = [], isLoading } = trpc.events.list.useQuery({});

  // 현재 월의 캘린더 데이터 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 월의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 캘린더 시작 (이전 달의 일부 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 캘린더 끝 (다음 달의 일부 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // 각 날짜의 행사 찾기
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // 이전/다음 월 이동
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-600">행사 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">행사 캘린더</h1>
          <p className="text-slate-600">동인 행사 일정을 한눈에 확인하세요</p>
        </div>

        {/* 캘린더 카드 */}
        <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {/* 캘린더 헤더 */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousMonth}
                className="text-white hover:bg-purple-500"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-2xl font-bold">{monthYear}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="text-white hover:bg-purple-500"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* 캘린더 본체 */}
          <div className="p-6">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center font-semibold text-slate-700 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            {events.length === 0 ? (
              <div className="col-span-7 text-center py-12 text-slate-500">
                <p>표시할 행사가 없습니다.</p>
              </div>
            ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      isCurrentMonth
                        ? 'bg-white border-slate-200 hover:border-purple-400'
                        : 'bg-slate-50 border-slate-100'
                    } ${isToday ? 'border-purple-500 bg-purple-50' : ''}`}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setLocation(`/event/${dayEvents[0].id}`);
                      }
                    }}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                      } ${isToday ? 'text-purple-600' : ''}`}
                    >
                      {date.getDate()}
                    </div>

                    {/* 행사 표시 */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded truncate font-medium hover:bg-purple-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/event/${event.id}`);
                          }}
                        >
                          {event.name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 px-2">
                          +{dayEvents.length - 2}개 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </Card>

        {/* 범례 */}
        {events.length > 0 && (
        <div className="mt-8 flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-500"></div>
            <span className="text-sm text-slate-600">오늘</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 text-purple-700 text-xs flex items-center justify-center">
              ●
            </div>
            <span className="text-sm text-slate-600">행사 있음</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
