import { TaskRepository, ReminderRepository } from '../db';
import { notificationService } from './NotificationService';
import type { Task, Reminder } from '../types';

class ReminderService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Check every 30 seconds
    this.checkReminders();
    this.intervalId = setInterval(() => this.checkReminders(), 30000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async checkReminders(): Promise<void> {
    if (notificationService.getPermission() !== 'granted') return;

    const now = new Date().toISOString();
    const pendingReminders = await ReminderRepository.getPending(now);

    for (const reminder of pendingReminders) {
      const task = await TaskRepository.getById(reminder.taskId);
      if (!task || task.completed) {
        await ReminderRepository.markFired(reminder.id);
        continue;
      }

      await notificationService.showNotification(task, reminder);
      await ReminderRepository.markFired(reminder.id);
    }
  }

  async createRemindersForTask(task: Task, reminderOffsets: number[]): Promise<Reminder[]> {
    const reminders: Reminder[] = [];

    for (const offsetMinutes of reminderOffsets) {
      const triggerDate = this.calculateTriggerDate(task, offsetMinutes);
      if (!triggerDate) continue;

      const reminder: Reminder = {
        id: crypto.randomUUID(),
        taskId: task.id,
        triggerDateTime: triggerDate.toISOString(),
        fired: false,
      };

      await ReminderRepository.create(reminder);
      reminders.push(reminder);
    }

    return reminders;
  }

  async deleteRemindersForTask(taskId: string): Promise<void> {
    await ReminderRepository.deleteByTaskId(taskId);
  }

  private calculateTriggerDate(task: Task, offsetMinutes: number): Date | null {
    const dateStr = task.scheduledDate;
    const timeStr = task.scheduledTime;

    let baseDate: Date;

    if (timeStr) {
      baseDate = new Date(`${dateStr}T${timeStr}:00`);
    } else {
      // Default to 9:00 AM if no time specified
      baseDate = new Date(`${dateStr}T09:00:00`);
    }

    if (isNaN(baseDate.getTime())) return null;

    const triggerDate = new Date(baseDate.getTime() - offsetMinutes * 60 * 1000);
    return triggerDate;
  }
}

export const reminderService = new ReminderService();
