import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns';
import type { Recurrence, Task } from '../types';

export function getNextOccurrence(task: Task): string | null {
  const { recurrence, scheduledDate } = task;
  if (recurrence.type === 'none') return null;

  const baseDate = parseISO(scheduledDate);
  let nextDate: Date;

  switch (recurrence.type) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekdays': {
      nextDate = addDays(baseDate, 1);
      // Skip weekends
      while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
        nextDate = addDays(nextDate, 1);
      }
      break;
    }
    case 'weekly':
      nextDate = addWeeks(baseDate, 1);
      break;
    case 'monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    case 'custom': {
      if (!recurrence.customDays || recurrence.customDays.length === 0) return null;
      nextDate = addDays(baseDate, 1);
      // Find next matching day
      for (let i = 1; i <= 7; i++) {
        const checkDate = addDays(baseDate, i);
        if (recurrence.customDays.includes(checkDate.getDay())) {
          nextDate = checkDate;
          break;
        }
      }
      break;
    }
    default:
      return null;
  }

  // Check end date
  if (recurrence.endDate) {
    const endDate = parseISO(recurrence.endDate);
    if (nextDate > endDate) return null;
  }

  return format(nextDate, 'yyyy-MM-dd');
}

export function getRecurrenceLabel(recurrence: Recurrence): string {
  switch (recurrence.type) {
    case 'none':
      return 'Не повторяется';
    case 'daily':
      return 'Каждый день';
    case 'weekdays':
      return 'По будням';
    case 'weekly':
      return 'Каждую неделю';
    case 'monthly':
      return 'Каждый месяц';
    case 'custom': {
      if (!recurrence.customDays || recurrence.customDays.length === 0) return 'Никогда';
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      return recurrence.customDays.map(d => dayNames[d]).join(', ');
    }
    default:
      return '';
  }
}

export const REMINDER_OPTIONS = [
  { label: 'В момент события', value: 0 },
  { label: 'За 5 минут', value: 5 },
  { label: 'За 15 минут', value: 15 },
  { label: 'За 30 минут', value: 30 },
  { label: 'За 1 час', value: 60 },
  { label: 'За 2 часа', value: 120 },
  { label: 'За 1 день', value: 1440 },
];
