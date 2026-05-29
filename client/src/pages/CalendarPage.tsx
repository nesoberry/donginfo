import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
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

    // 월요일 시작 (0=일, 1=월 ... 6=토)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startOffset);

    let endOffset = 6 - lastDay.getDay();
    if (lastDay.getDay() === 0) endOffset = 6;
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + endOffset);

    const days: Date[] = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
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

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const monthYear = currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const today = new Date();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>행사 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', padding: '32px 40px', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>행사 캘린더</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={prevMonth}
            style={{
              width: '32px', height: '32px', border: '1px solid #e0e0e0',
              borderRadius: '50%', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#444',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#1a1a1a', minWidth: '120px', textAlign: 'center' }}>
            {monthYear}
          </span>
          <button
            onClick={nextMonth}
            style={{
              width: '32px', height: '32px', border: '1px solid #e0e0e0',
              borderRadius: '50%', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#444',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 캘린더 테이블 */}
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e0e0e0' }}>
          {weekDays.map((day) => (
            <div
              key={day}
              style={{
                padding: '10px 0',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 500,
                color: '#70757a',
                borderRight: '1px solid #e0e0e0',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarDays.map((date, idx) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();

            return (
              <div
                key={idx}
                style={{
                  minHeight: '120px',
                  borderRight: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0',
                  background: '#ffffff',
                  padding: '6px 8px',
                  boxSizing: 'border-box',
                  verticalAlign: 'top',
                }}
              >
                {/* 날짜 숫자 */}
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#1a73e8' : isCurrentMonth ? '#1a1a1a' : '#b0b0b0',
                    marginBottom: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? '#e8f0fe' : 'transparent',
                  }}
                >
                  {date.getDate()}
                </div>

                {/* 행사 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => setLocation(`/event/${event.id}`)}
                      style={{
                        fontSize: '11px',
                        color: '#000000',
                        background: 'transparent',
                        padding: '2px 4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        borderLeft: '3px solid #4285f4',
                        paddingLeft: '6px',
                      }}
                      title={event.name}
                    >
                      {event.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '11px', color: '#70757a', paddingLeft: '4px' }}>
                      +{dayEvents.length - 3}개
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
