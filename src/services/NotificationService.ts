import type { Task, Reminder } from '../types';

export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermission;
    } catch {
      return 'denied';
    }
  }

  async showNotification(task: Task, reminder: Reminder): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const timeStr = task.scheduledTime
      ? ` в ${task.scheduledTime}`
      : '';
    const dateStr = task.scheduledDate;

    const options: NotificationOptions = {
      body: `Задача на ${dateStr}${timeStr}${task.description ? '\n' + task.description.slice(0, 100) : ''}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: reminder.id,
      data: { taskId: task.id, reminderId: reminder.id },
      requireInteraction: false,
    };

    try {
      const notification = new Notification(`📋 ${task.title}`, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async showTestNotification(): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;

    try {
      const notification = new Notification('✅ Уведомления работают!', {
        body: 'Вы будете получать напоминания о задачах.',
        icon: '/icons/icon-192.png',
      });
      setTimeout(() => notification.close(), 5000);
      return true;
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();
