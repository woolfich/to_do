import { useState, useMemo } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getCalendarDays, getWeekDays, getTodayStr, format, isToday, parseISO } from '../utils/date';
import { TaskItem } from './TaskItem';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';

export function CalendarView() {
  const { selectedDate, setSelectedDate, openAddTask } = useUIStore();
  const tasks = useTaskStore((s) => s.tasks);
  const firstDayOfWeek = useSettingsStore((s) => s.firstDayOfWeek);

  const today = getTodayStr();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = parseISO(selectedDate || today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weekDays = getWeekDays(firstDayOfWeek);
  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth.year, currentMonth.month, firstDayOfWeek),
    [currentMonth.year, currentMonth.month, firstDayOfWeek]
  );

  // Dates that have tasks
  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.scheduledDate));
    return set;
  }, [tasks]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === selectedDate),
    [tasks, selectedDate]
  );

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: m };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: m };
    });
  };

  const goToToday = () => {
    const d = new Date();
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(today);
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.month;

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth.month]} {currentMonth.year}
          </h2>
          <button
            onClick={goToToday}
            className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          >
            Сегодня
          </button>
        </div>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = dateStr === selectedDate;
            const isTodayDate = isToday(date);
            const hasTasks = datesWithTasks.has(dateStr);
            const inMonth = isCurrentMonth(date);

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(date)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                  ${isSelected
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : isTodayDate
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : inMonth
                        ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-300 dark:text-gray-600'
                  }`}
                aria-label={format(date, 'd MMMM yyyy')}
              >
                <span>{date.getDate()}</span>
                {hasTasks && !isSelected && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isTodayDate ? 'bg-blue-400' : 'bg-gray-400 dark:bg-gray-500'
                  }`} />
                )}
                {hasTasks && isSelected && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks for selected date */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isToday(parseISO(selectedDate)) ? 'Сегодня' : format(parseISO(selectedDate), 'd MMMM, EEEE')}
          </h3>
          <button
            onClick={openAddTask}
            className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            aria-label="Добавить задачу"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Нет задач на этот день</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <TaskItem key={task.id} taskId={task.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
