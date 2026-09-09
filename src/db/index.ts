import Dexie, { type Table } from 'dexie';
import type { Task, Reminder, Settings } from '../types';

export class TodoDatabase extends Dexie {
  tasks!: Table<Task, string>;
  reminders!: Table<Reminder, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('TodoPWA');
    this.version(1).stores({
      tasks: 'id, scheduledDate, completed, priority, createdAt',
      reminders: 'id, taskId, triggerDateTime, fired',
      settings: 'id',
    });
  }
}

export const db = new TodoDatabase();

// Task Repository
export const TaskRepository = {
  async getAll(): Promise<Task[]> {
    return db.tasks.toArray();
  },

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  async getByDate(date: string): Promise<Task[]> {
    return db.tasks.where('scheduledDate').equals(date).toArray();
  },

  async create(task: Task): Promise<string> {
    return db.tasks.add(task);
  },

  async update(id: string, changes: Partial<Task>): Promise<number> {
    return db.tasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  async deleteByTaskId(taskId: string): Promise<void> {
    await db.tasks.delete(taskId);
  },

  async getOverdue(date: string): Promise<Task[]> {
    return db.tasks
      .where('scheduledDate')
      .below(date)
      .and((task) => !task.completed)
      .toArray();
  },

  async getCompletedToday(date: string): Promise<Task[]> {
    return db.tasks
      .where('scheduledDate')
      .equals(date)
      .and((task) => task.completed)
      .toArray();
  },

  async getUpcoming(fromDate: string, toDate: string): Promise<Task[]> {
    return db.tasks
      .where('scheduledDate')
      .between(fromDate, toDate, true, true)
      .toArray();
  },

  async getDatesWithTasks(fromDate: string, toDate: string): Promise<string[]> {
    const tasks = await db.tasks
      .where('scheduledDate')
      .between(fromDate, toDate, true, true)
      .toArray();
    return [...new Set(tasks.map((t) => t.scheduledDate))];
  },
};

// Reminder Repository
export const ReminderRepository = {
  async getAll(): Promise<Reminder[]> {
    return db.reminders.toArray();
  },

  async getByTaskId(taskId: string): Promise<Reminder[]> {
    return db.reminders.where('taskId').equals(taskId).toArray();
  },

  async create(reminder: Reminder): Promise<string> {
    return db.reminders.add(reminder);
  },

  async update(id: string, changes: Partial<Reminder>): Promise<number> {
    return db.reminders.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.reminders.delete(id);
  },

  async deleteByTaskId(taskId: string): Promise<void> {
    await db.reminders.where('taskId').equals(taskId).delete();
  },

  async getPending(before: string): Promise<Reminder[]> {
    return db.reminders
      .where('triggerDateTime')
      .belowOrEqual(before)
      .and((r) => !r.fired)
      .toArray();
  },

  async markFired(id: string): Promise<number> {
    return db.reminders.update(id, { fired: true });
  },
};

// Settings Repository
export const SettingsRepository = {
  async get(): Promise<Settings> {
    const settings = await db.settings.get('app-settings');
    if (settings) return settings;
    const defaults: Settings = {
      id: 'app-settings',
      theme: 'system',
      firstDayOfWeek: 1,
      notificationsEnabled: false,
      showCompleted: true,
    };
    await db.settings.add(defaults);
    return defaults;
  },

  async update(changes: Partial<Settings>): Promise<number> {
    return db.settings.update('app-settings', changes);
  },
};
