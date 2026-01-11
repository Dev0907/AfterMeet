import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import NeoButton from './ui/NeoButton';
import NeoCard from './ui/NeoCard';

const CalendarView = ({ meetings = [], tasks = [], onDateClick, onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        );
    };

    const getEventsForDay = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

        const dayMeetings = meetings.filter(m =>
            new Date(m.scheduledStart).toDateString() === dateStr
        ).map(m => ({ ...m, type: 'meeting' }));

        const dayTasks = tasks.filter(t =>
            t.dueDate && new Date(t.dueDate).toDateString() === dateStr
        ).map(t => ({ ...t, type: 'task' }));

        return [...dayMeetings, ...dayTasks];
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-neo-yellow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CalendarIcon size={24} />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <NeoButton onClick={prevMonth} variant="secondary">
                        <ChevronLeft />
                    </NeoButton>
                    <NeoButton onClick={() => setCurrentDate(new Date())} variant="primary">
                        Today
                    </NeoButton>
                    <NeoButton onClick={nextMonth} variant="secondary">
                        <ChevronRight />
                    </NeoButton>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-black uppercase text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
                {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="h-32 bg-gray-50 border-2 border-dashed border-gray-200" />
                ))}

                {days.map(day => {
                    const events = getEventsForDay(day);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day}
                            onClick={() => onDateClick && onDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                            className={`min-h-[128px] border-2 border-black p-2 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer relative ${isCurrentDay ? 'bg-neo-yellow/20' : 'bg-white'
                                }`}
                        >
                            <span className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center font-bold text-sm ${isCurrentDay ? 'bg-neo-yellow border-2 border-black rounded-full' : 'text-gray-500'
                                }`}>
                                {day}
                            </span>

                            <div className="mt-8 space-y-1">
                                {events.map((event, idx) => (
                                    <div
                                        key={event.id || idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick && onEventClick(event);
                                        }}
                                        className={`text-xs p-1.5 border-2 border-black font-bold truncate ${event.type === 'meeting'
                                                ? 'bg-neo-purple text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-neo-green text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        title={event.title}
                                    >
                                        {event.type === 'meeting' ? (
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(event.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <CheckCircle size={10} />
                                                Task
                                            </div>
                                        )}
                                        {event.title}
                                    </div>
                                ))}
                                {events.length > 3 && (
                                    <div className="text-xs text-center font-bold text-gray-500">
                                        + {events.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
