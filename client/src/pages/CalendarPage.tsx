import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = trpc.events.list.useQuery({});

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
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
      <div className="min-h-screen bg-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-600">행사 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-slate-900">행사 캘린더</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousMonth}
                className="text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-slate-900 w-32 text-center">{monthYear}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="text-slate-600 hover:bg-slate-100"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 캘린더 본체 */}
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>표시할 행사가 없습니다.</p>
          </div>
        ) : (
          <div className="border border-gray-200">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-white border-b border-gray-200">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center font-semibold text-slate-700 py-3 text-sm border-r border-gray-200 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-32 p-2 border-r border-b border-gray-200 last:border-r-0 ${
                      index % 7 === 6 ? 'border-r-0' : ''
                    } ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'border-l-4 border-l-purple-600' : ''}`}
                  >
                    {/* 날짜 및 요일 */}
                    <div className={`text-sm font-semibold mb-1 ${
                      isCurrentMonth ? 'text-slate-900' : 'text-gray-400'
                    } ${isToday ? 'text-purple-600' : ''}`}>
                      {date.getDate()}
                    </div>

                    {/* 행사 표시 */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs text-black px-2 py-1 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/event/${event.id}`);
                          }}
                          title={event.name}
                        >
                          {event.name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 px-2">
                          +{dayEvents.length - 2}개
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
