# Todo PWA — Оффлайн Планировщик Задач

Современное Todo-приложение, работающее как Progressive Web App (PWA) с полной поддержкой оффлайн-режима.

## 🚀 Возможности

- **Offline-first** — все данные хранятся локально в IndexedDB
- **Напоминания** — Web Notifications API с гибкой настройкой времени
- **Календарь** — визуальное планирование по месяцам
- **Повторяющиеся задачи** — ежедневные, еженедельные, по будням, пользовательские
- **Приоритеты** — обычный, важный, критичный
- **Тёмная тема** — системная, светлая, тёмная
- **PWA** — установка на устройство как нативное приложение
- **Экспорт/Импорт** — резервное копирование в JSON
- **Адаптивный дизайн** — mobile-first, работает на всех устройствах

## 📦 Установка и запуск

### Разработка

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Production сборка

```bash
npm run build
```

Результат сборки будет в директории `dist/`.

### Проверка типов

```bash
npm run typecheck
```

## 🏗 Архитектура проекта

```
src/
├── types/           # TypeScript типы
│   └── index.ts     # Task, Reminder, Settings, Recurrence
├── db/              # Database layer (IndexedDB через Dexie)
│   └── index.ts     # TodoDatabase, TaskRepository, ReminderRepository, SettingsRepository
├── services/        # Бизнес-логика
│   ├── NotificationService.ts  # Web Notifications API
│   └── ReminderService.ts      # Проверка и создание напоминаний
├── stores/          # State management (Zustand)
│   ├── taskStore.ts      # Задачи
│   ├── settingsStore.ts  # Настройки
│   └── uiStore.ts        # UI состояние
├── components/      # UI компоненты
│   ├── TaskItem.tsx       # Элемент списка задач
│   ├── TaskForm.tsx       # Форма создания задачи
│   ├── TaskDetails.tsx    # Подробности задачи (modal)
│   ├── CalendarView.tsx   # Календарь
│   ├── SettingsView.tsx   # Настройки
│   └── ToastContainer.tsx # Toast уведомления
├── utils/           # Утилиты
│   ├── date.ts          # Работа с датами
│   ├── recurrence.ts    # Логика повторений
│   └── export.ts        # Экспорт/импорт данных
├── App.tsx          # Главный компонент
├── main.tsx         # Точка входа
└── index.css        # Стили (Tailwind CSS)

public/
├── manifest.json    # PWA manifest
├── sw.js            # Service Worker
└── icons/           # Иконки приложения
```

### Принципы архитектуры

- **UI ≠ бизнес-логика ≠ database ≠ notifications** — строгое разделение
- **Repository pattern** — компоненты не обращаются к IndexedDB напрямую
- **Offline-first** — все операции работают без интернета
- **Готовность к синхронизации** — архитектура позволяет добавить серверный слой

## 🗄 Структура IndexedDB

### Tasks
| Поле | Тип | Описание |
|------|-----|----------|
| id | string (UUID) | Уникальный идентификатор |
| title | string | Название задачи |
| description | string | Описание (опционально) |
| scheduledDate | string | Дата (YYYY-MM-DD) |
| scheduledTime | string \| null | Время (HH:mm) |
| completed | boolean | Статус выполнения |
| completedAt | string \| null | Дата/время выполнения |
| priority | enum | normal, high, critical |
| recurrence | object | Настройки повторения |
| createdAt | string | Дата создания |
| updatedAt | string | Дата обновления |

### Reminders
| Поле | Тип | Описание |
|------|-----|----------|
| id | string (UUID) | Уникальный идентификатор |
| taskId | string | ID связанной задачи |
| triggerDateTime | string | Дата/время срабатывания (ISO) |
| fired | boolean | Было ли отправлено |

### Settings
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | 'app-settings' |
| theme | enum | system, light, dark |
| firstDayOfWeek | number | 0 (Вс) или 1 (Пн) |
| notificationsEnabled | boolean | Включены ли уведомления |
| showCompleted | boolean | Показывать выполненные |

## 🔔 Работа уведомлений

### Как это работает

1. При создании задачи пользователь может добавить напоминания
2. ReminderService каждые 30 секунд проверяет.pending напоминания
3. Если время напоминания наступило — показывается Web Notification
4. Напоминание помечается как fired

### Ограничения Web Notifications

**Важно:** Web Notifications в браузере имеют существенные ограничения по сравнению с нативными уведомлениями:

#### Desktop (Chrome, Firefox, Edge)
- ✅ Работают надёжно при открытом сайте
- ✅ Поддерживают все опции (body, icon, tag, data)
- ⚠️ Могут не сработать если вкладка закрыта (зависит от браузера)
- ⚠️ Нет фоновой работы без Service Worker + Push API

#### Mobile (Chrome Android)
- ✅ Работают при открытом приложении
- ⚠️ Ограниченная поддержка фоновых уведомлений
- ⚠️ Могут быть убиты системой для экономии батареи
- ❌ Не работают в Safari iOS (ограниченная поддержка)

#### Safari (macOS)
- ✅ Поддержка с версии 16.4 (при установленном PWA)
- ⚠️ Требуется установка как PWA
- ❌ Не работают в обычной вкладке

#### Safari iOS
- ❌ Нет полноценной поддержки Web Notifications
- ⚠️ С iOS 16.4 — ограниченная поддержка для установленных PWA
- ❌ Нет фоновых уведомлений

### Для production-уровня уведомлений

Для надёжных push-уведомлений на всех платформах необходимо:
1. Настроить серверный Push API (VAPID)
2. Реализовать background sync
3. Использовать Notification API через Service Worker
4. Рассмотреть платформо-специфичные решения

В текущей MVP-версии уведомления работают через стандартный Web Notifications API, что достаточно для desktop и частично для mobile.

## 📱 Offline режим

### Что работает оффлайн:
- ✅ Просмотр всех задач
- ✅ Создание задач
- ✅ Редактирование задач
- ✅ Удаление задач
- ✅ Выполнение задач
- ✅ Календарь
- ✅ Настройки
- ✅ Напоминания (если приложение открыто)

### Service Worker стратегия:
- **Навигация:** Network-first с fallback на кэш
- **Статические ресурсы:** Cache-first
- **Версионирование:** При обновлении старый кэш очищается

## 💾 Экспорт / Импорт

### Экспорт
Скачивает JSON-файл со всеми данными:
- Все задачи
- Все напоминания
- Настройки

### Импорт
- Выбирается JSON-файл
- Проверяется структура
- Существующие данные заменяются
- Страница перезагружается

## 🎨 Дизайн

- **Mobile-first** — оптимизирован для тач-интерфейса
- **Touch targets** — минимум 44px
- **Анимации** — плавные, ненавязчивые
- **Тёмная тема** — полная поддержка
- **Адаптивность** — от 320px до desktop

## 🔧 Технологии

- **React 18** — UI библиотека
- **TypeScript** — строгая типизация
- **Vite** — сборщик
- **Tailwind CSS 4** — стилизация
- **Dexie.js** — обёртка для IndexedDB
- **Zustand** — state management
- **date-fns** — работа с датами
- **lucide-react** — иконки

## 📋 Roadmap

- [ ] Синхронизация с сервером
- [ ] Drag & drop сортировка
- [ ] Теги/категории задач
- [ ] Поиск по задачам
- [ ] Подзадачи
- [ ] Push API для фоновых уведомлений
- [ ] Widget для мобильных устройств

## 📄 Лицензия

MIT
