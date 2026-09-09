import { create } from 'zustand';
import type { View, ToastMessage } from '../types';
import { getTodayStr } from '../utils/date';

interface UIState {
  currentView: View;
  selectedDate: string;
  selectedTaskId: string | null;
  isTaskDetailsOpen: boolean;
  isAddTaskOpen: boolean;
  toasts: ToastMessage[];
  installPromptEvent: Event | null;
  showInstallBanner: boolean;

  setView: (view: View) => void;
  setSelectedDate: (date: string) => void;
  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setInstallPrompt: (event: Event | null) => void;
  setShowInstallBanner: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'today',
  selectedDate: getTodayStr(),
  selectedTaskId: null,
  isTaskDetailsOpen: false,
  isAddTaskOpen: false,
  toasts: [],
  installPromptEvent: null,
  showInstallBanner: false,

  setView: (view) => set({ currentView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  openTaskDetails: (taskId) => set({ selectedTaskId: taskId, isTaskDetailsOpen: true }),
  closeTaskDetails: () => set({ selectedTaskId: null, isTaskDetailsOpen: false }),
  
  openAddTask: () => set({ isAddTaskOpen: true }),
  closeAddTask: () => set({ isAddTaskOpen: false }),
  
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  setInstallPrompt: (event) => set({ installPromptEvent: event }),
  setShowInstallBanner: (show) => set({ showInstallBanner: show }),
}));
