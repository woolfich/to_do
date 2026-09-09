import { db } from '../db';
import type { Task, Reminder, Settings } from '../types';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: Task[];
  reminders: Reminder[];
  settings: Settings[];
}

export async function exportData(): Promise<void> {
  const tasks = await db.tasks.toArray();
  const reminders = await db.reminders.toArray();
  const settings = await db.settings.toArray();

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    reminders,
    settings,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<{ success: boolean; message: string; counts: { tasks: number; reminders: number } }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ExportData;

    if (!data.version || !Array.isArray(data.tasks)) {
      return { success: false, message: 'Неверный формат файла', counts: { tasks: 0, reminders: 0 } };
    }

    // Clear existing data
    await db.tasks.clear();
    await db.reminders.clear();

    // Import tasks
    if (data.tasks.length > 0) {
      await db.tasks.bulkAdd(data.tasks);
    }

    // Import reminders
    if (data.reminders && data.reminders.length > 0) {
      await db.reminders.bulkAdd(data.reminders);
    }

    // Import settings
    if (data.settings && data.settings.length > 0) {
      await db.settings.clear();
      await db.settings.bulkAdd(data.settings);
    }

    return {
      success: true,
      message: `Импортировано: ${data.tasks.length} задач, ${data.reminders?.length || 0} напоминаний`,
      counts: { tasks: data.tasks.length, reminders: data.reminders?.length || 0 },
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'Ошибка при импорте файла', counts: { tasks: 0, reminders: 0 } };
  }
}
