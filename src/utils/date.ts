import { format, isToday, isTomorrow, isYesterday, parseISO, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Сегодня';
  if (isTomorrow(date)) return 'Завтра';
  if (isYesterday(date)) return 'Вчера';
  return format(date, 'd MMMM', { locale: ru });
}

export function formatDateFull(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'EEEE, d MMMM yyyy', { locale: ru });
}

export function formatShortDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'd MMM', { locale: ru });
}

export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getTomorrowStr(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

export function isOverdue(task: { scheduledDate: string; scheduledTime: string | null; completed: boolean }): boolean {
  if (task.completed) return false;
  const today = getTodayStr();
  if (task.scheduledDate < today) return true;
  if (task.scheduledDate === today && task.scheduledTime) {
    const now = new Date();
    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    return now > taskTime;
  }
  return false;
}

export function getCalendarDays(year: number, month: number, firstDayOfWeek: 0 | 1): Date[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

export function getWeekDays(firstDayOfWeek: 0 | 1): string[] {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  if (firstDayOfWeek === 1) {
    return [...days.slice(1), days[0]];
  }
  return days;
}

export function sortTasks<T extends { scheduledTime: string | null; completed: boolean; scheduledDate: string }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks go last
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // Tasks with time come before tasks without time
    if (a.scheduledTime && !b.scheduledTime) return -1;
    if (!a.scheduledTime && b.scheduledTime) return 1;
    
    // Sort by time
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    
    return 0;
  });
}

export { format, parseISO, isToday, addDays };
