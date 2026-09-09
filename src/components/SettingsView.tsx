import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/NotificationService';
import { exportData, importData } from '../utils/export';
import { useUIStore } from '../stores/uiStore';
import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Bell, Download, Upload, Eye, EyeOff, Calendar } from 'lucide-react';

export function SettingsView() {
  const settings = useSettingsStore();
  const addToast = useUIStore((s) => s.addToast);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    settings.updateSettings({ theme });
  };

  const handleFirstDayChange = (day: 0 | 1) => {
    settings.updateSettings({ firstDayOfWeek: day });
  };

  const handleNotifToggle = async () => {
    if (!settings.notificationsEnabled) {
      const perm = await notificationService.requestPermission();
      if (perm === 'granted') {
        settings.updateSettings({ notificationsEnabled: true });
        addToast({ message: 'Уведомления включены', type: 'success' });
      } else if (perm === 'unsupported') {
        addToast({ message: 'Уведомления не поддерживаются в этом браузере', type: 'error' });
      } else {
        addToast({ message: 'Разрешите уведомления в настройках браузера', type: 'error' });
      }
    } else {
      settings.updateSettings({ notificationsEnabled: false });
    }
  };

  const handleShowCompletedToggle = () => {
    settings.updateSettings({ showCompleted: !settings.showCompleted });
  };

  const handleExport = async () => {
    try {
      await exportData();
      addToast({ message: 'Данные экспортированы', type: 'success' });
    } catch {
      addToast({ message: 'Ошибка при экспорте', type: 'error' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const result = await importData(file);
    setIsImporting(false);

    if (result.success) {
      addToast({ message: result.message, type: 'success' });
      // Reload the page to refresh all data
      window.location.reload();
    } else {
      addToast({ message: result.message, type: 'error' });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTestNotification = async () => {
    const success = await notificationService.showTestNotification();
    if (!success) {
      addToast({ message: 'Не удалось показать уведомление', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Настройки</h2>

      {/* Theme */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Тема оформления</h3>
        <div className="flex gap-2">
          {([
            { value: 'system', label: 'Системная', icon: Monitor },
            { value: 'light', label: 'Светлая', icon: Sun },
            { value: 'dark', label: 'Тёмная', icon: Moon },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                settings.theme === value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* First day of week */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          <Calendar className="w-4 h-4" />
          Первый день недели
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleFirstDayChange(1)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              settings.firstDayOfWeek === 1
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Понедельник
          </button>
          <button
            onClick={() => handleFirstDayChange(0)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              settings.firstDayOfWeek === 0
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Воскресенье
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          <Bell className="w-4 h-4" />
          Уведомления
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Включить уведомления</span>
            <button
              onClick={handleNotifToggle}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={settings.notificationsEnabled}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          {settings.notificationsEnabled && (
            <button
              onClick={handleTestNotification}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
            >
              Тестовое уведомление
            </button>
          )}
          {!notificationService.isSupported() && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Ваш браузер не поддерживает Web Notifications. Напоминания могут работать некорректно.
            </p>
          )}
        </div>
      </section>

      {/* Display */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Отображение
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Показывать выполненные задачи</span>
          <button
            onClick={handleShowCompletedToggle}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings.showCompleted ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={settings.showCompleted}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.showCompleted ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Данные</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Экспорт данных (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Импорт...' : 'Импорт данных'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </section>

      {/* About */}
      <section className="text-center py-4">
        <p className="text-xs text-gray-400">Todo PWA v1.0</p>
        <p className="text-xs text-gray-400 mt-1">Offline-first • Данные хранятся локально</p>
      </section>
    </div>
  );
}
