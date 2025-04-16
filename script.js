"use strict";

const tg = window.Telegram.WebApp;

// --- Глобальные переменные ---
let tasks = [];
let editingIndex = null; // Индекс задачи, которая редактируется, null - если никакая

// --- Функция установки темы ---
function setThemeClass() {
    console.log("setThemeClass called. Scheme:", tg.colorScheme);
    try {
        const root = document.documentElement;
        const themeParams = tg.themeParams;
        const hexToRgb = (hex) => {
             if (!hex || typeof hex !== 'string') return null;
             const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
             return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };
        const defaults = {
             light: { bg: '#ffffff', text: '#212529', hint: '#6c757d', link: '#0d6efd', button: '#0d6efd', button_text: '#ffffff', secondary_bg: '#f8f9fa' },
             dark: { bg: '#181e25', text: '#ffffff', hint: '#a5acb5', link: '#6ea8fe', button: '#2e7ddb', button_text: '#ffffff', secondary_bg: '#212831' }
        };
        const scheme = tg.colorScheme || 'light';
        const currentDefaults = defaults[scheme];
        const params = themeParams || {};

        root.style.setProperty('--tg-theme-bg-color', params.bg_color || currentDefaults.bg);
        root.style.setProperty('--tg-theme-text-color', params.text_color || currentDefaults.text);
        root.style.setProperty('--tg-theme-hint-color', params.hint_color || currentDefaults.hint);
        root.style.setProperty('--tg-theme-link-color', params.link_color || currentDefaults.link);
        root.style.setProperty('--tg-theme-button-color', params.button_color || currentDefaults.button);
        root.style.setProperty('--tg-theme-button-text-color', params.button_text_color || currentDefaults.button_text);
        root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color || currentDefaults.secondary_bg);
        root.style.setProperty('--tg-theme-bg-color-rgb', hexToRgb(params.bg_color || currentDefaults.bg) || (scheme === 'dark' ? '24, 30, 37' : '255, 255, 255'));
        root.style.setProperty('--tg-theme-text-color-rgb', hexToRgb(params.text_color || currentDefaults.text) || (scheme === 'dark' ? '255, 255, 255' : '33, 37, 41'));
        root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(params.hint_color || currentDefaults.hint) || (scheme === 'dark' ? '165, 172, 181' : '108, 117, 125'));
        root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(params.button_color || currentDefaults.button) || (scheme === 'dark' ? '46, 125, 219' : '13, 110, 253'));
        root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(params.secondary_bg_color || currentDefaults.secondary_bg) || (scheme === 'dark' ? '33, 40, 49' : '248, 249, 250'));

        document.body.classList.toggle('dark', scheme === 'dark');
    } catch (e) {
        console.error("Error in setThemeClass:", e);
    }
}

// --- Функции для работы со списком задач ---

// Рендер списка задач
function renderTasks() {
    console.log("renderTasks called. Tasks:", tasks);
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!taskList || !addTaskBtn) {
        console.error("renderTasks Error: Critical elements not found!");
        return;
    }
    taskList.innerHTML = ''; // Очищаем

    if (editingIndex !== null) {
        cancelEdit();
    }

    if (tasks.length === 0) {
        const noTasksLi = document.createElement('li');
        noTasksLi.className = 'no-tasks';
        noTasksLi.textContent = 'Пока задач нет...';
        taskList.appendChild(noTasksLi);
        // Показываем элемент "нет задач"
        setTimeout(() => { noTasksLi.classList.add('visible'); }, 10);
        return;
    }

    tasks.forEach((taskText, index) => {
        try {
            const listItem = document.createElement('li');
            listItem.dataset.index = index;

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = taskText;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '✏️';
            editBtn.setAttribute('aria-label', 'Изменить задачу');
            editBtn.dataset.index = index;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.setAttribute('aria-label', 'Удалить задачу');
            deleteBtn.dataset.index = index;

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            listItem.appendChild(textSpan);
            listItem.appendChild(actionsDiv);
            taskList.appendChild(listItem);

            setTimeout(() => {
                listItem.classList.add('visible');
            }, 10 * index); // Каскадная анимация

        } catch (e) {
            console.error(`Error rendering task ${index}:`, e);
        }
    });
    console.log("renderTasks finished.");
}

// Добавление или сохранение задачи
function addTask() {
    console.log("addTask function called. Editing index:", editingIndex);
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn) {
        console.error("addTask Error: Input or Add button not found!");
        tg.showAlert("Ошибка интерфейса.");
        return;
    }

    try {
        const taskText = input.value.trim();
        console.log("Task text from input:", taskText);

        if (taskText === "") {
            tg.HapticFeedback.notificationOccurred('warning');
            tg.showAlert("Пожалуйста, введите текст задачи!");
            input.focus();
            return;
        }

        if (editingIndex !== null) {
            console.log(`Saving changes for task at index ${editingIndex}`);
            tasks[editingIndex] = taskText;
            editingIndex = null;
            addTaskBtn.textContent = 'Добавить';
            input.value = '';
            renderTasks();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            console.log("Adding new task.");
            tasks.push(taskText);
            input.value = '';
            renderTasks();
            tg.HapticFeedback.impactOccurred('light');
            // input.focus(); // Опционально
        }
    } catch (e) {
        console.error("Error in addTask/saveTask:", e);
        tg.showAlert("Произошла ошибка при сохранении задачи.");
        cancelEdit();
    }
}

// Начало редактирования
function startEditTask(index) {
    console.log(`Starting edit for task index: ${index}`);
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn || tasks[index] === undefined) {
        console.error("startEditTask Error: Elements not found or index out of bounds.");
        return;
    }

    if (editingIndex !== null && editingIndex !== index) {
       cancelEdit();
    }

    try {
        input.value = tasks[index];
        addTaskBtn.textContent = 'Сохранить';
        editingIndex = index;
        input.focus();
        tg.HapticFeedback.impactOccurred('medium');
        // Подсветка редактируемого элемента (опционально)
        // document.querySelector(`#task-list li[data-index="${index}"]`)?.classList.add('editing');
    } catch (e) {
        console.error("Error in startEditTask:", e);
        tg.showAlert("Не удалось начать редактирование.");
        cancelEdit();
    }
}

// Удаление задачи
function deleteTask(index) {
    console.log(`Attempting to delete task index: ${index}`);
    if (tasks[index] === undefined) {
        console.error("deleteTask Error: Index out of bounds.");
        return;
    }

    try {
        tg.showConfirm(`Удалить задачу:\n"${tasks[index]}"?`, (confirmed) => {
            if (confirmed) {
                console.log(`Confirmed deletion for index: ${index}`);
                try {
                    tasks.splice(index, 1);
                    if (editingIndex === index) {
                        cancelEdit(); // Если удаляли редактируемую, отменяем редактирование
                    } else {
                        renderTasks(); // Иначе просто перерисовываем
                    }
                    tg.HapticFeedback.notificationOccurred('success');
                } catch (e) {
                    console.error("Error during task deletion splice/render:", e);
                    tg.showAlert("Не удалось удалить задачу.");
                }
            } else {
                console.log(`Deletion cancelled for index: ${index}`);
                tg.HapticFeedback.impactOccurred('light');
            }
        });
    } catch (e) {
        console.error("Error calling tg.showConfirm:", e);
        // Попытка удалить без подтверждения в крайнем случае? Или просто показать ошибку
        tg.showAlert("Ошибка вызова подтверждения удаления.");
    }
}

// Отмена режима редактирования
function cancelEdit() {
    console.log("Cancelling edit mode.");
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn) return;

    editingIndex = null;
    addTaskBtn.textContent = 'Добавить';
    input.value = '';
    // Убираем подсветку (если добавляли)
    // document.querySelectorAll('#task-list li.editing').forEach(li => li.classList.remove('editing'));
}

// --- Инициализация приложения ---
function initializeApp() {
    console.log("initializeApp called.");

    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const sendTasksBtn = document.getElementById('send-tasks-btn');
    const closeBtn = document.getElementById('close-btn');
    const taskListUl = document.getElementById('task-list');
    const userInfoDiv = document.getElementById('user-info');

    if (!addTaskBtn || !newTaskInput || !sendTasksBtn || !closeBtn || !taskListUl || !userInfoDiv) {
        console.error("Critical element(s) not found! Aborting initialization.");
        document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Ошибка загрузки интерфейса. Пожалуйста, попробуйте перезапустить приложение.</div>';
        try { tg.showAlert("Ошибка загрузки интерфейса."); } catch (e) {}
        return;
    }
    console.log("All critical elements found.");

    // --- Настройка темы и Telegram API ---
    try {
        setThemeClass();
        tg.onEvent('themeChanged', setThemeClass);
        tg.expand();
        tg.ready();
        console.log("Telegram WebApp SDK initialized and ready.");
    } catch (e) {
        console.error("Error initializing Telegram WebApp features:", e);
        try { tg.showAlert("Не удалось инициализировать функции Telegram."); } catch (ignore) {}
    }

    // --- Отображение данных пользователя ---
    try {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            userInfoDiv.innerHTML = `Задачи для: <strong>${user.first_name || 'User'}</strong>`;
        } else {
            userInfoDiv.innerHTML = 'Данные пользователя недоступны';
        }
    } catch(e) { console.error("Error displaying user info:", e); userInfoDiv.innerHTML = 'Ошибка отображения данных'; }

    // --- Инициализация списка задач ---
    // TODO: В будущем здесь можно будет загружать задачи из localStorage или от бота
    renderTasks(); // Начинаем с пустого (или загруженного) списка

    // --- Обработчики событий ---
    try {
        // Кнопка "Добавить" / "Сохранить"
        addTaskBtn.addEventListener('click', addTask);
        console.log("Listener added to addTaskBtn");

        // Enter в поле ввода
        newTaskInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTask();
            }
        });
        console.log("Listener added to newTaskInput");

        // Делегирование событий для кнопок в списке
        taskListUl.addEventListener('click', (event) => {
            const target = event.target;
            console.log("Click inside task list detected. Target:", target);

            const editButton = target.closest('.edit-btn');
            const deleteButton = target.closest('.delete-btn');

            if (editButton) {
                console.log("Edit button clicked.");
                const index = parseInt(editButton.dataset.index, 10);
                if (!isNaN(index)) {
                    startEditTask(index);
                } else {
                    console.error("Could not parse index from edit button:", editButton.dataset.index);
                }
                return;
            }

            if (deleteButton) {
                console.log("Delete button clicked.");
                const index = parseInt(deleteButton.dataset.index, 10);
                if (!isNaN(index)) {
                    deleteTask(index);
                } else {
                     console.error("Could not parse index from delete button:", deleteButton.dataset.index);
                }
                return;
            }
        });
        console.log("Event delegation listener added to taskListUl");


        // Кнопка "Отправить Задачи"
        sendTasksBtn.addEventListener('click', () => {
             console.log("sendTasksBtn clicked.");
             if (tasks.length === 0) {
                 tg.HapticFeedback.notificationOccurred('warning');
                 tg.showAlert("Список задач пуст.");
                 return;
             }
             if (editingIndex !== null) {
                 cancelEdit(); // Отменяем редактирование перед отправкой
             }
             const dataToSend = JSON.stringify({
                 action: "send_task_list",
                 tasks: tasks,
                 timestamp: new Date().toISOString()
             });
             console.log("Sending data:", dataToSend);
             try {
                 tg.sendData(dataToSend);
                 tg.HapticFeedback.notificationOccurred('success');
                 tg.showAlert("Задачи отправлены!");
             } catch (e) {
                 console.error("Error sending data:", e);
                 tg.showAlert("Ошибка отправки данных.");
             }
        });
        console.log("Listener added to sendTasksBtn");

        // Кнопка "Закрыть"
        closeBtn.addEventListener('click', () => {
            console.log("closeBtn clicked.");
            if (editingIndex !== null) {
                cancelEdit(); // Отменяем редактирование перед закрытием
            }
            try {
                tg.close();
            } catch (e) {
                console.error("Error closing WebApp:", e);
            }
        });
        console.log("Listener added to closeBtn");

    } catch (e) {
        console.error("Error adding event listeners:", e);
        tg.showAlert("Ошибка настройки интерфейса.");
    }
}

// --- Запуск инициализации после загрузки DOM ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}