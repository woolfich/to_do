import { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from './stores/taskStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { reminderService } from './services/ReminderService';
import { getTodayStr, formatDateFull, isOverdue } from './utils/date';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { TaskDetails } from './components/TaskDetails';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { ToastContainer } from './components/ToastContainer';
import { Plus, Calendar, Settings, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ListTodo } from 'lucide-react';

// Keyboard shortcuts hook
function useKeyboardShortcuts() {
  const openAddTask = useUIStore((s) => s.openAddTask);
  const isAddTaskOpen = useUIStore((s) => s.isAddTaskOpen);
  const isTaskDetailsOpen = useUIStore((s) => s.isTaskDetailsOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т') {
        e.preventDefault();
        openAddTask();
      }
      if (e.key === 'Escape') {
        if (isTaskDetailsOpen) {
          useUIStore.getState().closeTaskDetails();
        } else if (isAddTaskOpen) {
          useUIStore.getState().closeAddTask();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openAddTask, isAddTaskOpen, isTaskDetailsOpen]);
}

function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);
  const openAddTask = useUIStore((s) => s.openAddTask);
  const setView = useUIStore((s) => s.setView);
  const selectedDate = useUIStore((s) => s.selectedDate);
  const showCompleted = useSettingsStore((s) => s.showCompleted);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);

  const today = getTodayStr();

  const { overdueTasks, todayTasks, completedTasks } = useMemo(() => {
    const overdue = tasks.filter((t) => isOverdue(t) && t.scheduledDate < today);
    const todayAll = tasks.filter((t) => t.scheduledDate === today);
    const active = todayAll.filter((t) => !t.completed);
    const completed = todayAll.filter((t) => t.completed);

    // Sort active: with time first, then without
    const withTime = active.filter((t) => t.scheduledTime).sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
    const withoutTime = active.filter((t) => !t.scheduledTime);

    return {
      overdueTasks: overdue.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
      todayTasks: [...withTime, ...withoutTime],
      completedTasks: completed,
    };
  }, [tasks, today]);

  const totalActive = todayTasks.length;
  const totalCompleted = completedTasks.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateFull(today)}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Сегодня</h1>
          {totalActive > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalCompleted} из {totalActive + totalCompleted} выполнено
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('calendar')}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Календарь"
          >
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={openAddTask}
            className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-colors"
            aria-label="Добавить задачу"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {(totalActive + totalCompleted) > 0 && (
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalCompleted / (totalActive + totalCompleted)) * 100}%` }}
          />
        </div>
      )}

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500 mb-2 px-1">
            <AlertCircle className="w-4 h-4" />
            Просрочено ({overdueTasks.length})
          </h3>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskItem key={task.id} taskId={task.id} />
            ))}
          </div>
        </div>
      )}

      {/* Today's tasks */}
      {todayTasks.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">
            Задачи ({todayTasks.length})
          </h3>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskItem key={task.id} taskId={task.id} />
            ))}
          </div>
        </div>
      ) : overdueTasks.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            На сегодня всё чисто
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Добавьте задачу, чтобы спланировать день
          </p>
          <button
            onClick={openAddTask}
            className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            + Добавить задачу
          </button>
        </div>
      ) : null}

      {/* Completed tasks */}
      {showCompleted && completedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setCompletedCollapsed(!completedCollapsed)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1 w-full"
          >
            {completedCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            Выполнено ({completedTasks.length})
          </button>
          {!completedCollapsed && (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} taskId={task.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InstallBanner() {
  const { installPromptEvent, showInstallBanner, setShowInstallBanner } = useUIStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      useUIStore.getState().setInstallPrompt(e);
      // Show banner only once per session
      const wasShown = sessionStorage.getItem('install-banner-shown');
      if (!wasShown) {
        useUIStore.getState().setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showInstallBanner || dismissed || !installPromptEvent) return null;

  const handleInstall = async () => {
    const event = installPromptEvent as any;
    event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    sessionStorage.setItem('install-banner-shown', 'true');
    useUIStore.getState().setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstallBanner(false);
    sessionStorage.setItem('install-banner-shown', 'true');
  };

  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Установить приложение</p>
          <p className="text-xs text-blue-100 mt-0.5">Быстрый доступ без браузера</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-white text-blue-600 text-sm font-medium"
          >
            Установить
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const settings = useSettingsStore();
  const currentView = useUIStore((s) => s.currentView);
  const setView = useUIStore((s) => s.setView);
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);
  const isLoading = useTaskStore((s) => s.isLoading);

  // Initialize
  useEffect(() => {
    loadSettings();
    loadTasks();
  }, []);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // system
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  // Start reminder service
  useEffect(() => {
    reminderService.start();
    return () => reminderService.stop();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <InstallBanner />

        {currentView === 'today' && <TodayView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'settings' && <SettingsView />}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          <button
            onClick={() => { setView('today'); setSelectedDate(getTodayStr()); }}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              currentView === 'today'
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Сегодня"
          >
            <ListTodo className="w-5 h-5" />
            <span className="text-xs font-medium">Сегодня</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              currentView === 'calendar'
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Календарь"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Календарь</span>
          </button>
          <button
            onClick={() => setView('settings')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              currentView === 'settings'
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            aria-label="Настройки"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Настройки</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <TaskForm />
      <TaskDetails />
      <ToastContainer />
    </div>
  );
}
