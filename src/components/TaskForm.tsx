import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/NotificationService';
import { getTodayStr, getTomorrowStr } from '../utils/date';
import { REMINDER_OPTIONS } from '../utils/recurrence';
import type { Priority, RecurrenceType, Recurrence } from '../types';
import { X, Calendar, Clock, Bell, Flag, Repeat, ChevronDown } from 'lucide-react';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function TaskForm() {
  const { isAddTaskOpen, closeAddTask, selectedDate } = useUIStore();
  const addTask = useTaskStore((s) => s.addTask);
  const firstDayOfWeek = useSettingsStore((s) => s.firstDayOfWeek);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || getTodayStr());
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notifPermission, setNotifPermission] = useState(notificationService.getPermission());

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddTaskOpen) {
      setTitle('');
      setDescription('');
      setDate(selectedDate || getTodayStr());
      setTime('');
      setPriority('normal');
      setRecurrenceType('none');
      setCustomDays([]);
      setReminderOffsets([]);
      setShowAdvanced(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isAddTaskOpen, selectedDate]);

  if (!isAddTaskOpen) return null;

  const handleRequestNotifPermission = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
  };

  const toggleReminderOffset = (offset: number) => {
    setReminderOffsets((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset]
    );
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const recurrence: Recurrence = {
      type: recurrenceType,
      ...(recurrenceType === 'custom' ? { customDays } : {}),
    };

    await addTask(
      {
        title: title.trim(),
        description: description.trim(),
        scheduledDate: date,
        scheduledTime: time || null,
        completed: false,
        completedAt: null,
        priority,
        recurrence,
      },
      reminderOffsets.length > 0 ? reminderOffsets : undefined
    );

    closeAddTask();
  };

  const orderedDays = firstDayOfWeek === 1
    ? [1, 2, 3, 4, 5, 6, 0]
    : [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeAddTask}
      />

      {/* Form */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Новая задача</h2>
          <button
            onClick={closeAddTask}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white dark:placeholder-gray-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={2}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>

          {/* Date & Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                Дата
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDate(getTodayStr())}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    date === getTodayStr()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getTomorrowStr())}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    date === getTomorrowStr()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Завтра
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              Время (необязательно)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Flag className="w-4 h-4" />
              Приоритет
            </label>
            <div className="flex gap-2">
              {(['normal', 'high', 'critical'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    priority === p
                      ? p === 'critical'
                        ? 'bg-red-500 text-white'
                        : p === 'high'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p === 'normal' ? 'Обычный' : p === 'high' ? 'Важный' : 'Критичный'}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced options toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Дополнительные настройки
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              {/* Recurrence */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Repeat className="w-4 h-4" />
                  Повторение
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="none">Не повторяется</option>
                  <option value="daily">Каждый день</option>
                  <option value="weekdays">По будням</option>
                  <option value="weekly">Каждую неделю</option>
                  <option value="monthly">Каждый месяц</option>
                  <option value="custom">Пользовательский</option>
                </select>

                {recurrenceType === 'custom' && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {orderedDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleCustomDay(day)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                          customDays.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {DAY_NAMES[day]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Bell className="w-4 h-4" />
                  Напоминания
                </label>
                
                {notifPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestNotifPermission}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-2"
                  >
                    {notifPermission === 'unsupported'
                      ? 'Уведомления не поддерживаются'
                      : notifPermission === 'denied'
                        ? 'Разрешите уведомления в настройках браузера'
                        : 'Включить уведомления'}
                  </button>
                )}

                {notifPermission === 'granted' && (
                  <div className="flex flex-wrap gap-2">
                    {REMINDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleReminderOffset(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          reminderOffsets.includes(opt.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-500/20"
          >
            Создать задачу
          </button>
        </form>
      </div>
    </div>
  );
}
