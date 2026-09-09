import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { ReminderRepository } from '../db';
import { Bell, Clock, X, Check, RotateCcw, Calendar, AlertTriangle, Flame } from 'lucide-react';
import type { Priority } from '../types';

function priorityVisuals(priority: Priority) {
  switch (priority) {
    case 'critical':
      return {
        color: 'red' as const,
        icon: Flame,
        label: 'Критично',
        accent: 'bg-red-500',
        ring: 'ring-red-500/30',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        chip: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      };
    case 'high':
      return {
        color: 'amber' as const,
        icon: AlertTriangle,
        label: 'Важно',
        accent: 'bg-amber-500',
        ring: 'ring-amber-500/30',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        chip: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      };
    default:
      return {
        color: 'blue' as const,
        icon: Bell,
        label: 'Напоминание',
        accent: 'bg-blue-500',
        ring: 'ring-blue-500/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        chip: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      };
  }
}

export function ReminderModal() {
  const queue = useUIStore((s) => s.reminderNotifications);
  const dismiss = useUIStore((s) => s.dismissReminderNotification);
  const openTaskDetails = useUIStore((s) => s.openTaskDetails);
  const addToast = useUIStore((s) => s.addToast);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  const current = queue[0];
  const isOpen = !!current;

  // Auto-dismiss after 60 seconds if user doesn't interact
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      dismiss(current.id);
    }, 60000);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss(current.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, current, dismiss]);

  if (!current) return null;

  const { task, reminder, triggeredAt } = current;
  const visuals = priorityVisuals(task.priority);
  const { icon: Icon, label } = visuals;

  const handleOpenTask = () => {
    openTaskDetails(task.id);
    dismiss(current.id);
  };

  const handleComplete = async () => {
    await toggleTask(task.id);
    dismiss(current.id);
    addToast({ message: 'Задача выполнена', type: 'success' });
  };

  const handleSnooze = async (minutes: number) => {
    const newTrigger = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    await ReminderRepository.update(reminder.id, { triggerDateTime: newTrigger, fired: false });
    dismiss(current.id);
    addToast({ message: `Отложено на ${minutes} мин`, type: 'info' });
  };

  const handleDismiss = () => {
    dismiss(current.id);
  };

  const timeStr = task.scheduledTime ? `в ${task.scheduledTime}` : '';
  const triggerTime = new Date(triggeredAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
      onClick={(e) => {
        // Click on backdrop closes the modal
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={`
          w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl
          rounded-t-3xl sm:rounded-3xl
          max-h-[90vh] overflow-hidden
          animate-slide-up sm:animate-pop-in
          ring-1 ${visuals.ring}
        `}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className={`px-5 pt-4 pb-3 ${visuals.accent}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Time chip */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Сработало в {triggerTime}</span>
            {timeStr && (
              <>
                <span>·</span>
                <Calendar className="w-3.5 h-3.5" />
                <span>Задача {timeStr}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h2
            id="reminder-title"
            className="text-xl font-bold text-gray-900 dark:text-white leading-tight"
          >
            {task.title}
          </h2>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Priority chip */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${visuals.chip}`}>
              <Icon className="w-3 h-3" />
              {label}
            </span>
            {task.recurrence.type !== 'none' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <RotateCcw className="w-3 h-3" />
                Повтор
              </span>
            )}
          </div>
        </div>

        {/* Snooze row */}
        <div className="px-5 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Отложить:</p>
          <div className="flex gap-2">
            {[5, 15, 60].map((m) => (
              <button
                key={m}
                onClick={() => handleSnooze(m)}
                className="flex-1 px-2 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {m < 60 ? `${m} мин` : '1 час'}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleComplete}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" />
            Выполнить
          </button>
          <button
            onClick={handleOpenTask}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Открыть задачу
          </button>
        </div>

        {/* Queue indicator if there are more */}
        {queue.length > 1 && (
          <div className="px-5 pb-4 text-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              + ещё {queue.length - 1} {queue.length - 1 === 1 ? 'уведомление' : 'уведомления'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
