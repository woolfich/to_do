import { create } from 'zustand';
import type { Task, Priority, Recurrence } from '../types';
import { TaskRepository, ReminderRepository } from '../db';
import { reminderService } from '../services/ReminderService';
import { getTodayStr, sortTasks } from '../utils/date';
import { getNextOccurrence } from '../utils/recurrence';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  loadTasksForDate: (date: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, reminderOffsets?: number[]) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getTasksForDate: (date: string) => Task[];
  getOverdueTasks: () => Task[];
  getCompletedTasks: (date: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  error: null,

  loadTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await TaskRepository.getAll();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: 'Не удалось загрузить задачи', isLoading: false });
    }
  },

  loadTasksForDate: async (_date: string) => {
    // Tasks are already loaded, filtering happens in selectors
    const state = get();
    if (state.tasks.length === 0) {
      await state.loadTasks();
    }
  },

  addTask: async (taskData, reminderOffsets) => {
    try {
      const now = new Date().toISOString();
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await TaskRepository.create(task);

      // Create reminders if offsets provided
      if (reminderOffsets && reminderOffsets.length > 0) {
        await reminderService.createRemindersForTask(task, reminderOffsets);
      }

      set((state) => ({ tasks: [...state.tasks, task] }));
    } catch (error) {
      console.error('Failed to add task:', error);
      set({ error: 'Не удалось создать задачу' });
    }
  },

  updateTask: async (id, changes) => {
    try {
      await TaskRepository.update(id, changes);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: 'Не удалось обновить задачу' });
    }
  },

  toggleTask: async (id) => {
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const isCompleting = !task.completed;
      const changes: Partial<Task> = {
        completed: isCompleting,
        completedAt: isCompleting ? new Date().toISOString() : null,
      };

      await TaskRepository.update(id, changes);

      // If completing a recurring task, create next occurrence
      if (isCompleting && task.recurrence.type !== 'none') {
        const nextDate = getNextOccurrence(task);
        if (nextDate) {
          const now = new Date().toISOString();
          const nextTask: Task = {
            ...task,
            id: crypto.randomUUID(),
            scheduledDate: nextDate,
            completed: false,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          await TaskRepository.create(nextTask);
          set((state) => ({ tasks: [...state.tasks, nextTask] }));
        }
      }

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      // Delete associated reminders
      await ReminderRepository.deleteByTaskId(id);
      await TaskRepository.delete(id);

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  getTasksForDate: (date) => {
    const tasks = get().tasks.filter((t) => t.scheduledDate === date);
    return sortTasks(tasks);
  },

  getOverdueTasks: () => {
    const today = getTodayStr();
    return get().tasks.filter((t) => {
      if (t.completed) return false;
      if (t.scheduledDate >= today) return false;
      return true;
    });
  },

  getCompletedTasks: (date) => {
    return get().tasks.filter((t) => t.scheduledDate === date && t.completed);
  },
}));
