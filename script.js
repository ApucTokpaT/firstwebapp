"use strict";

const tg = window.Telegram.WebApp;
const STORAGE_KEY = 'todoAppTasks_v2'; // Новый ключ, чтобы не конфликтовать со старыми данными

// --- Глобальные переменные ---
let tasks = []; // Массив объектов задач
let editingId = null; // ID задачи, которая редактируется
let currentFilter = 'all'; // Текущий фильтр ('all', 'active', 'completed')

// --- Функция установки темы (как была) ---
function setThemeClass() { /* ... код без изменений ... */
    console.log("setThemeClass called. Scheme:", tg.colorScheme);
    try {
        const root = document.documentElement;
        const themeParams = tg.themeParams;
        const hexToRgb = (hex) => {
             if (!hex || typeof hex !== 'string') return null;
             const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
             return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };
        const defaults = { dark: { hint: '#adb5bd', link: '#7aaaff', button: '#3a86ff', button_text: '#ffffff', secondary_bg: 'rgba(40, 48, 56, 0.9)' } };
        const currentDefaults = defaults.dark;
        const params = themeParams || {};
        root.style.setProperty('--tg-theme-hint-color', params.hint_color || currentDefaults.hint);
        root.style.setProperty('--tg-theme-link-color', params.link_color || currentDefaults.link);
        root.style.setProperty('--tg-theme-button-color', params.button_color || currentDefaults.button);
        root.style.setProperty('--tg-theme-button-text-color', params.button_text_color || currentDefaults.button_text);
        root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color ? `rgba(${hexToRgb(params.secondary_bg_color)}, 0.9)` : currentDefaults.secondary_bg);
        root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(params.hint_color || currentDefaults.hint) || '173, 181, 189');
        root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(params.button_color || currentDefaults.button) || '58, 134, 255');
        root.style.setProperty('--tg-theme-secondary-bg-color-value', hexToRgb(params.secondary_bg_color) || '40, 48, 56'); // Используем RGB переменную для rgba()
        document.body.classList.toggle('dark', true);
    } catch (e) { console.error("Error in setThemeClass:", e); }
}

// --- Функции Сохранения/Загрузки ---
function loadTasks() {
    console.log("Loading tasks...");
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
        try {
            // Простая проверка, что это массив объектов с id и text
            const parsed = JSON.parse(savedTasks);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'id' in item && 'text' in item)) {
                 tasks = parsed;
                 console.log("Tasks loaded:", tasks.length);
            } else {
                console.warn("Invalid data format in localStorage, starting fresh.");
                tasks = [];
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.error("Error parsing tasks:", e);
            tasks = [];
            localStorage.removeItem(STORAGE_KEY);
        }
    } else {
        tasks = [];
        console.log("No saved tasks found.");
    }
}
function saveTasks() {
    console.log("Saving tasks...");
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        console.log("Tasks saved.");
    } catch (e) {
        console.error("Error saving tasks:", e);
        try { tg.showAlert("Не удалось сохранить задачи."); } catch (ae) {}
    }
}

// --- Хелперы ---
function generateId() { return Date.now() + Math.random(); }
function formatDate(isoString) {
    if (!isoString) return null;
    try {
        const date = new Date(isoString);
        // Проверка на валидность даты
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return null;
    }
}
function parseTags(tagsString) {
    if (!tagsString || typeof tagsString !== 'string') return [];
    return tagsString.split(',')
        .map(tag => tag.trim()) // Убираем пробелы
        .filter(tag => tag !== ''); // Убираем пустые теги
}
function tagsToString(tagsArray) {
     if (!Array.isArray(tagsArray)) return '';
     return tagsArray.join(', ');
}

// --- Рендер и Фильтрация ---
function renderTasks() {
    console.log(`Rendering tasks with filter: ${currentFilter}`);
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    // Фильтруем задачи
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; // На всякий случай
    });

    // Обновляем счетчик
    updateTaskCounter();
    // Показываем/скрываем кнопку очистки
    toggleClearCompletedButton();

    taskList.innerHTML = ''; // Очищаем список

    if (filteredTasks.length === 0) {
        const noTasksLi = document.createElement('li');
        noTasksLi.className = 'no-tasks';
        noTasksLi.textContent = currentFilter === 'all' ? 'Задач пока нет...' :
                                currentFilter === 'active' ? 'Нет активных задач.' :
                                'Нет выполненных задач.';
        taskList.appendChild(noTasksLi);
        setTimeout(() => { noTasksLi.classList.add('visible'); }, 10);
        return;
    }

    // Сортируем (например, невыполненные сначала, потом по дате создания)
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Невыполненные выше
        }
        // Можно добавить сортировку по приоритету или дате
        return new Date(b.createdAt) - new Date(a.createdAt); // Новые выше
    });

    filteredTasks.forEach((task) => {
        try {
            const listItem = document.createElement('li');
            listItem.dataset.id = task.id; // Используем ID
            listItem.classList.toggle('completed', task.completed);

            // Основной контейнер контента задачи
            const itemContent = document.createElement('div');
            itemContent.className = 'task-item-content';

            // Чекбокс
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.dataset.id = task.id; // ID для обработчика

            // Контейнер для деталей (текст, мета, теги)
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'task-details';

            // Текст задачи
            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;

            // Мета-информация (приоритет, дата)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'task-meta';

            // Приоритет
            if (task.priority) {
                const prioritySpan = document.createElement('span');
                prioritySpan.className = `task-priority ${task.priority}`;
                prioritySpan.textContent = { high: 'Высокий 🔥', medium: 'Средний ✨', low: 'Низкий 💤' }[task.priority] || task.priority;
                metaDiv.appendChild(prioritySpan);
            }

            // Дата выполнения
            const formattedDate = formatDate(task.dueDate);
            if (formattedDate) {
                const dateSpan = document.createElement('span');
                dateSpan.className = 'task-due-date';
                dateSpan.textContent = `Срок: ${formattedDate}`;
                // Проверка на просроченность
                const today = new Date(); today.setHours(0,0,0,0); // Сегодняшняя дата без времени
                const dueDate = new Date(task.dueDate);
                if (!isNaN(dueDate.getTime()) && dueDate < today && !task.completed) {
                     dateSpan.classList.add('overdue');
                     dateSpan.textContent += ' (Просрочено!)';
                }
                metaDiv.appendChild(dateSpan);
            }

            // Теги
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'task-tags';
            if (task.tags && task.tags.length > 0) {
                task.tags.forEach(tagText => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag';
                    tagSpan.textContent = tagText;
                    tagsDiv.appendChild(tagSpan);
                });
            }

            // Собираем детали
            detailsDiv.appendChild(textSpan);
            if(metaDiv.hasChildNodes()) detailsDiv.appendChild(metaDiv); // Добавляем мету, если есть
            if(tagsDiv.hasChildNodes()) detailsDiv.appendChild(tagsDiv); // Добавляем теги, если есть

            // Собираем левую часть (чекбокс + детали)
            itemContent.appendChild(checkbox);
            itemContent.appendChild(detailsDiv);

            // --- Кнопки действий (Edit/Delete) ---
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';
            const editBtn = document.createElement('button'); editBtn.className = 'edit-btn'; editBtn.innerHTML = '✏️'; editBtn.setAttribute('aria-label', 'Изменить'); editBtn.dataset.id = task.id;
            const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-btn'; deleteBtn.innerHTML = '🗑️'; deleteBtn.setAttribute('aria-label', 'Удалить'); deleteBtn.dataset.id = task.id;
            actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);

            // Собираем весь LI
            listItem.appendChild(itemContent);
            listItem.appendChild(actionsDiv);
            taskList.appendChild(listItem);

            // Анимация появления
            requestAnimationFrame(() => { // Даем браузеру отрисовать элемент перед анимацией
                 listItem.classList.add('visible');
            });

        } catch (e) { console.error(`Error rendering task id ${task.id}:`, e); }
    });
    console.log("Rendering finished.");
}

function updateTaskCounter() {
    const counterElement = document.getElementById('task-counter');
    if (!counterElement) return;
    const activeTasks = tasks.filter(task => !task.completed).length;
    counterElement.textContent = `Активных: ${activeTasks} / Всего: ${tasks.length}`;
}

function toggleClearCompletedButton() {
    const clearBtn = document.getElementById('clear-completed-btn');
    if(!clearBtn) return;
    const hasCompleted = tasks.some(task => task.completed);
    clearBtn.style.display = hasCompleted ? 'block' : 'none'; // Показываем, только если есть выполненные
}


// --- Обработка Действий с Задачами ---
function addTask() {
    const taskInput = document.getElementById('new-task-input');
    const prioritySelect = document.getElementById('priority-select');
    const dateInput = document.getElementById('due-date-input');
    const tagsInput = document.getElementById('tags-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    if (!taskInput || !prioritySelect || !dateInput || !tagsInput || !addTaskBtn || !cancelEditBtn) return;

    const taskText = taskInput.value.trim();
    if (taskText === "") {
        tg.HapticFeedback.notificationOccurred('warning');
        tg.showAlert("Введите название задачи!");
        taskInput.focus();
        return;
    }

    const newTask = {
        id: editingId ? editingId : generateId(), // Используем старый ID при редактировании
        text: taskText,
        completed: editingId ? tasks.find(t=>t.id === editingId)?.completed || false : false, // Сохраняем статус при ред.
        priority: prioritySelect.value || 'medium',
        dueDate: dateInput.value || null, // Пустая строка станет null
        tags: parseTags(tagsInput.value),
        createdAt: editingId ? tasks.find(t=>t.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    try {
        if (editingId) { // Редактирование
            const index = tasks.findIndex(t => t.id === editingId);
            if (index > -1) {
                tasks[index] = newTask;
            } else { // Если не нашли по ID (странно), добавим как новую
                 tasks.push(newTask);
            }
            console.log("Task updated:", newTask.id);
        } else { // Добавление
            tasks.push(newTask);
            console.log("Task added:", newTask.id);
        }

        saveTasks();
        cancelEdit(); // Сбрасываем форму и режим редактирования
        renderTasks();
        tg.HapticFeedback.impactOccurred(editingId ? 'medium' : 'light');

    } catch (e) {
        console.error("Error adding/updating task:", e);
        tg.showAlert("Ошибка при добавлении/обновлении задачи.");
    }
}

function startEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) {
        console.error("Task not found for editing:", id);
        return;
    }

    // Заполняем форму данными задачи
    document.getElementById('new-task-input').value = task.text;
    document.getElementById('priority-select').value = task.priority || 'medium';
    document.getElementById('due-date-input').value = task.dueDate || '';
    document.getElementById('tags-input').value = tagsToString(task.tags);

    editingId = id; // Устанавливаем ID редактируемой задачи

    // Меняем кнопку и показываем кнопку отмены
    document.getElementById('add-task-btn').textContent = 'Сохранить';
    document.getElementById('cancel-edit-btn').style.display = 'block';

    document.getElementById('new-task-input').focus();
    tg.HapticFeedback.impactOccurred('medium');
}

function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
        console.error("Task not found for deletion:", id);
        return;
    }
    const task = tasks[taskIndex];

    tg.showConfirm(`Удалить задачу:\n"${task.text}"?`, (confirmed) => {
        if (confirmed) {
            // Анимация удаления
            const listItem = document.querySelector(`#task-list li[data-id="${id}"]`);
            if (listItem) {
                listItem.classList.add('removing'); // Добавляем класс для CSS анимации
                // Ждем завершения анимации перед реальным удалением
                listItem.addEventListener('animationend', () => {
                    performDeletion(id);
                }, { once: true }); // Обработчик сработает один раз
            } else {
                 performDeletion(id); // Если элемент не найден, удаляем сразу
            }
        } else { tg.HapticFeedback.impactOccurred('light'); }
    });
}

function performDeletion(id) {
     const initialLength = tasks.length;
     tasks = tasks.filter(t => t.id !== id); // Удаляем из массива

     if (tasks.length < initialLength) { // Убедимся, что что-то удалили
         if (editingId === id) cancelEdit(); // Отменяем редактирование, если удалили эту задачу
         saveTasks();
         renderTasks(); // Перерисовываем список
         tg.HapticFeedback.notificationOccurred('success');
         console.log("Task deleted:", id);
     }
}


function toggleComplete(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        console.log(`Task ${id} completion toggled to: ${tasks[taskIndex].completed}`);
        saveTasks();
        // Не перерисовываем весь список, а только меняем класс у LI
        const listItem = document.querySelector(`#task-list li[data-id="${id}"]`);
        if (listItem) {
            listItem.classList.toggle('completed', tasks[taskIndex].completed);
            // Перерисовываем счетчик и кнопку очистки, т.к. статус изменился
            updateTaskCounter();
            toggleClearCompletedButton();
        } else {
            renderTasks(); // Перерисовать все, если элемент не найден
        }
        tg.HapticFeedback.impactOccurred('light');
    } else {
        console.error("Task not found for toggle:", id);
    }
}

function cancelEdit() {
    editingId = null;
    document.getElementById('new-task-input').value = '';
    document.getElementById('priority-select').value = 'medium';
    document.getElementById('due-date-input').value = '';
    document.getElementById('tags-input').value = '';
    document.getElementById('add-task-btn').textContent = 'Добавить';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    console.log("Edit cancelled.");
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        tg.showAlert("Нет выполненных задач для очистки.");
        return;
    }

    tg.showConfirm(`Удалить ${completedCount} выполненных задач?`, (confirmed) => {
        if (confirmed) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            tg.HapticFeedback.notificationOccurred('success');
            console.log("Completed tasks cleared.");
        } else {
            tg.HapticFeedback.impactOccurred('light');
        }
    });
}


// --- Инициализация Приложения ---
function initializeApp() {
    console.log("Initializing Advanced ToDo App...");

    // --- Получение элементов ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const sendTasksBtn = document.getElementById('send-tasks-btn');
    const closeBtn = document.getElementById('close-btn');
    const taskListUl = document.getElementById('task-list');
    const userInfoDiv = document.getElementById('user-info');
    const filterButtons = document.querySelectorAll('.filters .filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // --- Проверка критических элементов ---
    if (!addTaskBtn || !newTaskInput || !sendTasksBtn || !closeBtn || !taskListUl || !userInfoDiv || !filterButtons.length || !clearCompletedBtn || !cancelEditBtn) {
        console.error("Critical element(s) not found! Aborting.");
        document.body.innerHTML = '<div style="color: #ff7b7b; padding: 20px; text-align: center;">Ошибка загрузки интерфейса. Пожалуйста, перезапустите приложение.</div>';
        try { tg.showAlert("Ошибка загрузки интерфейса."); } catch (e) {}
        return;
    }
    console.log("All critical elements found.");

    // --- Настройка темы и TG API ---
    try { setThemeClass(); tg.onEvent('themeChanged', setThemeClass); tg.expand(); tg.ready(); }
    catch (e) { console.error("Error initializing Telegram SDK:", e); }

    // --- Инфо о пользователе ---
    try { /* ... код user info ... */
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) { const user = tg.initDataUnsafe.user; userInfoDiv.innerHTML = `Задачи для: <strong>${user.first_name || 'User'}</strong>`; } else { userInfoDiv.innerHTML = 'Данные пользователя недоступны'; }
    } catch(e) { console.error("Error displaying user info:", e); }

    // --- Загрузка и Рендер Задач ---
    loadTasks();
    renderTasks(); // Первый рендер

    // --- Обработчики Событий ---
    try {
        // Форма добавления/сохранения
        addTaskBtn.addEventListener('click', addTask);
        newTaskInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } });
        cancelEditBtn.addEventListener('click', cancelEdit);

        // Делегирование для списка задач (чекбокс, edit, delete)
        taskListUl.addEventListener('click', (event) => {
            const target = event.target;
            const listItem = target.closest('li[data-id]');
            if (!listItem) return; // Клик не по элементу списка

            const taskId = Number(listItem.dataset.id); // Получаем ID из LI
            if (isNaN(taskId)) return;

            // Клик по чекбоксу
            if (target.matches('.task-checkbox')) {
                 console.log("Checkbox clicked for task:", taskId);
                 toggleComplete(taskId);
                 return; // Важно, чтобы не сработали другие обработчики
            }
            // Клик по кнопке Edit
            if (target.closest('.edit-btn')) {
                console.log("Edit button clicked for task:", taskId);
                startEditTask(taskId);
                return;
            }
            // Клик по кнопке Delete
            if (target.closest('.delete-btn')) {
                console.log("Delete button clicked for task:", taskId);
                deleteTask(taskId);
                return;
            }
        });

        // Фильтры
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentFilter = button.dataset.filter;
                // Обновляем активную кнопку
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderTasks(); // Перерисовываем с новым фильтром
            });
        });

        // Очистка выполненных
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);

        // Отправка боту
        sendTasksBtn.addEventListener('click', () => { /* ... код отправки (без изменений) ... */
             if (tasks.length === 0) { tg.HapticFeedback.notificationOccurred('warning'); tg.showAlert("Список задач пуст."); return; }
             if (editingId !== null) cancelEdit();
             const dataToSend = JSON.stringify({ action: "send_tasks_to_user", tasks: tasks, timestamp: new Date().toISOString() });
             console.log("Sending data to bot for forwarding:", dataToSend);
             try { tg.sendData(dataToSend); tg.HapticFeedback.notificationOccurred('success'); tg.showAlert("Задачи отправлены боту для пересылки вам!");
             } catch (e) { console.error("Error sending data:", e); tg.showAlert("Ошибка отправки запроса боту."); }
        });

        // Закрытие
        closeBtn.addEventListener('click', () => { if (editingId !== null) cancelEdit(); try { tg.close(); } catch (e) {} });

        console.log("Event listeners added.");

    } catch (e) { console.error("Error adding event listeners:", e); tg.showAlert("Ошибка настройки интерфейса."); }
}

// --- Запуск ---
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeApp); } else { initializeApp(); }