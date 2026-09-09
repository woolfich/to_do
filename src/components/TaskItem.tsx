import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { isOverdue } from '../utils/date';
import { getRecurrenceLabel } from '../utils/recurrence';
import { ReminderRepository } from '../db';
import { useEffect, useState } from 'react';
import type { Reminder } from '../types';

interface TaskItemProps {
  taskId: string;
}

export function TaskItem({ taskId }: TaskItemProps) {
  const task = useTaskStore((s) => s.getTaskById(taskId));
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const openTaskDetails = useUIStore((s) => s.openTaskDetails);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (taskId) {
      ReminderRepository.getByTaskId(taskId).then(setReminders);
    }
  }, [taskId]);

  if (!task) return null;

  const overdue = isOverdue(task);
  const hasReminders = reminders.length > 0;
  const hasRecurrence = task.recurrence.type !== 'none';

  const priorityColors = {
    normal: '',
    high: 'bg-amber-400',
    critical: 'bg-red-500',
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
        ${task.completed 
          ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' 
          : overdue 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
            : 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700'
        }`}
      onClick={() => openTaskDetails(task.id)}
      role="button"
      tabIndex={0}
      aria-label={`Задача: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTaskDetails(task.id);
        }
      }}
    >
      {/* Checkbox */}
      <button
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${task.completed 
            ? 'bg-emerald-500 border-emerald-500' 
            : task.priority === 'critical' 
              ? 'border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' 
              : task.priority === 'high' 
                ? 'border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTask(task.id);
        }}
        aria-label={task.completed ? 'Отменить выполнение' : 'Выполнить задачу'}
      >
        {task.completed && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.scheduledTime && (
            <span className={`text-xs ${task.completed ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {task.scheduledTime}
            </span>
          )}
          {hasReminders && (
            <span className="text-xs text-blue-500" title="Есть напоминание">
              🔔
            </span>
          )}
          {hasRecurrence && (
            <span className="text-xs text-gray-400 dark:text-gray-500" title={getRecurrenceLabel(task.recurrence)}>
              🔄
            </span>
          )}
          {overdue && !task.completed && (
            <span className="text-xs text-red-500 font-medium">Просрочено</span>
          )}
        </div>
      </div>

      {/* Priority indicator */}
      {task.priority !== 'normal' && (
        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
      )}
    </div>
  );
}
