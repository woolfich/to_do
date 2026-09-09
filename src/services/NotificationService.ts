import type { Task, Reminder } from '../types';
import { useUIStore } from '../stores/uiStore';

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

  /**
   * Show a reminder notification.
   *
   * Two channels:
   *  1. In-app modal (always, when app is in foreground). This is the primary UX
   *     and works regardless of OS-level notification permission.
   *  2. System Web Notification (only if permission is granted). Works even
   *     when the app is in the background.
   */
  showNotification(task: Task, reminder: Reminder): void {
    // 1. Always queue an in-app notification. The ReminderModal component
    //    mounted in App.tsx reads this queue and renders the visible modal.
    useUIStore.getState().enqueueReminderNotification({
      id: crypto.randomUUID(),
      task,
      reminder,
      triggeredAt: new Date().toISOString(),
    });

    // 2. Additionally fire a system notification if the browser allows it.
    //    This is what makes reminders work when the app is in the background
    //    or the tab is not focused.
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const timeStr = task.scheduledTime ? ` в ${task.scheduledTime}` : '';
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
        useUIStore.getState().openTaskDetails(task.id);
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Failed to show system notification:', error);
    }
  }

  showTestNotification(): boolean {
    // Always show an in-app test notification
    const fakeTask: Task = {
      id: '__test__',
      title: 'Тестовое уведомление',
      description: 'Так будут выглядеть напоминания о задачах.',
      scheduledDate: new Date().toISOString().slice(0, 10),
      scheduledTime: null,
      completed: false,
      completedAt: null,
      priority: 'normal',
      recurrence: { type: 'none' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fakeReminder: Reminder = {
      id: '__test_reminder__',
      taskId: '__test__',
      triggerDateTime: new Date().toISOString(),
      fired: true,
    };
    useUIStore.getState().enqueueReminderNotification({
      id: crypto.randomUUID(),
      task: fakeTask,
      reminder: fakeReminder,
      triggeredAt: new Date().toISOString(),
    });

    // Also try a system notification if permission is granted
    if (!this.isSupported() || Notification.permission !== 'granted') return true;

    try {
      const notification = new Notification('✅ Уведомления работают!', {
        body: 'Вы будете получать напоминания о задачах.',
        icon: '/icons/icon-192.png',
      });
      setTimeout(() => notification.close(), 5000);
      return true;
    } catch {
      return true; // in-app modal was still queued, so functionally it works
    }
  }
}

export const notificationService = new NotificationService();
