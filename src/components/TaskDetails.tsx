import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { ReminderRepository } from '../db';
import { formatDateFull, isOverdue } from '../utils/date';
import { getRecurrenceLabel } from '../utils/recurrence';
import { notificationService } from '../services/NotificationService';
import type { Reminder, Priority } from '../types';
import { X, Check, Trash2, Edit3, Bell, Clock, Calendar, Flag, Repeat } from 'lucide-react';

export function TaskDetails() {
  const { isTaskDetailsOpen, selectedTaskId, closeTaskDetails } = useUIStore();
  const task = useTaskStore((s) => (selectedTaskId ? s.getTaskById(selectedTaskId) : undefined));
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addToast = useUIStore((s) => s.addToast);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('normal');
  const [notifPermission, setNotifPermission] = useState(notificationService.getPermission());

  useEffect(() => {
    if (selectedTaskId) {
      ReminderRepository.getByTaskId(selectedTaskId).then(setReminders);
    }
  }, [selectedTaskId, isTaskDetailsOpen]);

  useEffect(() => {
    if (task && isEditing) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditDate(task.scheduledDate);
      setEditTime(task.scheduledTime || '');
      setEditPriority(task.priority);
    }
  }, [task, isEditing]);

  if (!isTaskDetailsOpen || !task) return null;

  const overdue = isOverdue(task);

  const handleDelete = () => {
    const taskCopy = { ...task };
    deleteTask(task.id);
    closeTaskDetails();
    addToast({
      message: 'Задача удалена',
      type: 'info',
      undoAction: () => {
        // Re-add would require full implementation, showing toast for now
        addToast({ message: 'Восстановление не реализовано в MVP', type: 'info' });
      },
      undoLabel: 'Отменить',
    });
  };

  const handleSaveEdit = async () => {
    await updateTask(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      scheduledDate: editDate,
      scheduledTime: editTime || null,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  const handleRequestNotifPermission = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeTaskDetails} />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Подробности</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Редактировать"
            >
              <Edit3 className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={closeTaskDetails}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-lg font-medium bg-transparent border-b-2 border-blue-400 outline-none text-gray-900 dark:text-white pb-2"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Описание"
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 outline-none resize-none text-gray-900 dark:text-gray-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1">Дата</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1">Время</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Приоритет</label>
                <div className="flex gap-2">
                  {(['normal', 'high', 'critical'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        editPriority === p
                          ? p === 'critical' ? 'bg-red-500 text-white' : p === 'high' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {p === 'normal' ? 'Обычный' : p === 'high' ? 'Важный' : 'Критичный'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold"
              >
                Сохранить
              </button>
            </div>
          ) : (
            /* View mode */
            <>
              {/* Title & Status */}
              <div>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </h3>
                    {overdue && !task.completed && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        Просрочено
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Дата</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateFull(task.scheduledDate)}</p>
                  </div>
                </div>
                {task.scheduledTime && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Время</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{task.scheduledTime}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <Flag className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Приоритет</p>
                    <p className={`text-sm font-medium ${
                      task.priority === 'critical' ? 'text-red-500' : task.priority === 'high' ? 'text-amber-500' : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.priority === 'normal' ? 'Обычный' : task.priority === 'high' ? 'Важный' : 'Критичный'}
                    </p>
                  </div>
                </div>
                {task.recurrence.type !== 'none' && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Repeat className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Повторение</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{getRecurrenceLabel(task.recurrence)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Bell className="w-4 h-4" />
                    Напоминания
                  </h4>
                </div>
                {reminders.length > 0 ? (
                  <div className="space-y-1.5">
                    {reminders.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          {new Date(r.triggerDateTime).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {r.fired && <span className="text-xs text-gray-400 ml-auto">✓</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Нет напоминаний</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    task.completed
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {task.completed ? 'Не выполнено' : 'Выполнено'}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
