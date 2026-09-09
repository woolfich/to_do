// Core domain types for the Todo PWA

export type Priority = 'normal' | 'high' | 'critical';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  endDate?: string; // ISO date
}

export interface Reminder {
  id: string;
  taskId: string;
  triggerDateTime: string; // ISO datetime
  notificationId?: string;
  fired: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm or null
  completed: boolean;
  completedAt: string | null;
  priority: Priority;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  theme: 'system' | 'light' | 'dark';
  firstDayOfWeek: 0 | 1; // 0=Sunday, 1=Monday
  notificationsEnabled: boolean;
  showCompleted: boolean;
}

export type View = 'today' | 'calendar' | 'settings' | 'add-task' | 'task-details';

export interface AppState {
  currentView: View;
  selectedDate: string; // YYYY-MM-DD
  selectedTaskId: string | null;
  isTaskDetailsOpen: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  undoAction?: () => void;
  undoLabel?: string;
}
