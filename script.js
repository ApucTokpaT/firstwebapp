"use strict";

const tg = window.Telegram.WebApp;
const STORAGE_KEY = 'todoAppTasks'; // Ключ для localStorage

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
        // Устанавливаем только переменные, которые могут меняться от TG (кнопки, ссылки и т.д.)
        const defaults = {
             dark: { hint: '#adb5bd', link: '#7aaaff', button: '#3a86ff', button_text: '#ffffff', secondary_bg: 'rgba(40, 48, 56, 0.9)' }
        };
        const currentDefaults = defaults.dark; // Базируемся на темной теме
        const params = themeParams || {};

        // Обновляем только те переменные, которые могут отличаться в темной теме TG
        root.style.setProperty('--tg-theme-hint-color', params.hint_color || currentDefaults.hint);
        root.style.setProperty('--tg-theme-link-color', params.link_color || currentDefaults.link);
        root.style.setProperty('--tg-theme-button-color', params.button_color || currentDefaults.button);
        root.style.setProperty('--tg-theme-button-text-color', params.button_text_color || currentDefaults.button_text);
        // Для secondary_bg берем либо из TG (и делаем полупрозрачным), либо дефолтный (уже полупрозрачный)
        root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color ? `rgba(${hexToRgb(params.secondary_bg_color)}, 0.9)` : currentDefaults.secondary_bg);

        // RGB для кнопок и подсказок
        root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(params.hint_color || currentDefaults.hint) || '173, 181, 189');
        root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(params.button_color || currentDefaults.button) || '58, 134, 255');
        root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(params.secondary_bg_color) || '40, 48, 56'); // RGB без прозрачности

        document.body.classList.toggle('dark', true); // Всегда считаем темной темой для консистентности

    } catch (e) {
        console.error("Error in setThemeClass:", e);
    }
}

// --- Функции Сохранения/Загрузки Задач ---
function loadTasks() {
    console.log("Attempting to load tasks from localStorage.");
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            console.log("Tasks loaded successfully:", tasks);
        } catch (e) {
            console.error("Error parsing tasks from localStorage:", e);
            tasks = [];
            localStorage.removeItem(STORAGE_KEY);
        }
    } else {
        console.log("No tasks found in localStorage.");
        tasks = [];
    }
}
function saveTasks() {
    console.log("Attempting to save tasks to localStorage.");
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        console.log("Tasks saved successfully.");
    } catch (e) {
        console.error("Error saving tasks to localStorage:", e);
        try {
             tg.showAlert("Не удалось сохранить задачи. Возможно, хранилище переполнено.");
        } catch (alertError) { console.error("Failed to show save error alert:", alertError); }
    }
}

// --- Функции для работы со списком задач ---
function renderTasks() {
    console.log("renderTasks called. Tasks:", tasks);
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!taskList || !addTaskBtn) {
        console.error("renderTasks Error: Critical elements not found!");
        return;
    }
    taskList.innerHTML = '';
    if (editingIndex !== null) cancelEdit();

    if (tasks.length === 0) {
        const noTasksLi = document.createElement('li');
        noTasksLi.className = 'no-tasks';
        noTasksLi.textContent = 'Пока задач нет...';
        taskList.appendChild(noTasksLi);
        setTimeout(() => { noTasksLi.classList.add('visible'); }, 10);
        return;
    }

    tasks.forEach((taskText, index) => {
        try {
            const listItem = document.createElement('li'); listItem.dataset.index = index;
            const textSpan = document.createElement('span'); textSpan.className = 'task-text'; textSpan.textContent = taskText;
            const actionsDiv = document.createElement('div'); actionsDiv.className = 'task-actions';
            const editBtn = document.createElement('button'); editBtn.className = 'edit-btn'; editBtn.innerHTML = '✏️'; editBtn.setAttribute('aria-label', 'Изменить задачу'); editBtn.dataset.index = index;
            const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-btn'; deleteBtn.innerHTML = '🗑️'; deleteBtn.setAttribute('aria-label', 'Удалить задачу'); deleteBtn.dataset.index = index;
            actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);
            listItem.appendChild(textSpan); listItem.appendChild(actionsDiv);
            taskList.appendChild(listItem);
            setTimeout(() => { listItem.classList.add('visible'); }, 10 * index);
        } catch (e) { console.error(`Error rendering task ${index}:`, e); }
    });
    console.log("renderTasks finished.");
}
function addTask() {
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn) return;
    try {
        const taskText = input.value.trim();
        if (taskText === "") { tg.HapticFeedback.notificationOccurred('warning'); tg.showAlert("Пожалуйста, введите текст задачи!"); input.focus(); return; }
        if (editingIndex !== null) {
            tasks[editingIndex] = taskText; editingIndex = null; addTaskBtn.textContent = 'Добавить'; input.value = '';
            renderTasks(); saveTasks(); tg.HapticFeedback.notificationOccurred('success');
        } else {
            tasks.push(taskText); input.value = '';
            renderTasks(); saveTasks(); tg.HapticFeedback.impactOccurred('light');
        }
    } catch (e) { console.error("Error in addTask/saveTask:", e); tg.showAlert("Произошла ошибка при сохранении задачи."); cancelEdit(); }
}
function startEditTask(index) {
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn || tasks[index] === undefined) return;
    if (editingIndex !== null && editingIndex !== index) cancelEdit();
    try {
        input.value = tasks[index]; addTaskBtn.textContent = 'Сохранить'; editingIndex = index; input.focus(); tg.HapticFeedback.impactOccurred('medium');
    } catch (e) { console.error("Error in startEditTask:", e); tg.showAlert("Не удалось начать редактирование."); cancelEdit(); }
}
function deleteTask(index) {
    if (tasks[index] === undefined) return;
    try {
        tg.showConfirm(`Удалить задачу:\n"${tasks[index]}"?`, (confirmed) => {
            if (confirmed) {
                try {
                    tasks.splice(index, 1);
                    if (editingIndex === index) cancelEdit(); else renderTasks();
                    saveTasks(); tg.HapticFeedback.notificationOccurred('success');
                } catch (e) { console.error("Error during task deletion splice/render:", e); tg.showAlert("Не удалось удалить задачу."); }
            } else { tg.HapticFeedback.impactOccurred('light'); }
        });
    } catch (e) { console.error("Error calling tg.showConfirm:", e); tg.showAlert("Ошибка вызова подтверждения удаления."); }
}
function cancelEdit() {
    const input = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (!input || !addTaskBtn) return;
    editingIndex = null; addTaskBtn.textContent = 'Добавить'; input.value = '';
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
        document.body.innerHTML = '<div style="color: #ff7b7b; padding: 20px; text-align: center;">Ошибка загрузки интерфейса. Пожалуйста, перезапустите приложение.</div>';
        try { tg.showAlert("Ошибка загрузки интерфейса."); } catch (e) {}
        return;
    }
    console.log("All critical elements found.");

    try {
        setThemeClass(); tg.onEvent('themeChanged', setThemeClass); tg.expand(); tg.ready();
        console.log("Telegram WebApp SDK initialized and ready.");
    } catch (e) { console.error("Error initializing Telegram WebApp features:", e); try { tg.showAlert("Не удалось инициализировать функции Telegram."); } catch (ignore) {} }

    try {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user; userInfoDiv.innerHTML = `Задачи для: <strong>${user.first_name || 'User'}</strong>`;
        } else { userInfoDiv.innerHTML = 'Данные пользователя недоступны'; }
    } catch(e) { console.error("Error displaying user info:", e); userInfoDiv.innerHTML = 'Ошибка отображения данных'; }

    loadTasks(); renderTasks();

    try {
        addTaskBtn.addEventListener('click', addTask);
        newTaskInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } });
        taskListUl.addEventListener('click', (event) => {
            const target = event.target; const editButton = target.closest('.edit-btn'); const deleteButton = target.closest('.delete-btn');
            if (editButton) { const index = parseInt(editButton.dataset.index, 10); if (!isNaN(index)) startEditTask(index); return; }
            if (deleteButton) { const index = parseInt(deleteButton.dataset.index, 10); if (!isNaN(index)) deleteTask(index); return; }
        });
        sendTasksBtn.addEventListener('click', () => {
             if (tasks.length === 0) { tg.HapticFeedback.notificationOccurred('warning'); tg.showAlert("Список задач пуст."); return; }
             if (editingIndex !== null) cancelEdit();
             const dataToSend = JSON.stringify({ action: "send_tasks_to_user", tasks: tasks, timestamp: new Date().toISOString() });
             console.log("Sending data to bot for forwarding:", dataToSend);
             try { tg.sendData(dataToSend); tg.HapticFeedback.notificationOccurred('success'); tg.showAlert("Задачи отправлены боту для пересылки вам!");
             } catch (e) { console.error("Error sending data:", e); tg.showAlert("Ошибка отправки запроса боту."); }
        });
        closeBtn.addEventListener('click', () => { if (editingIndex !== null) cancelEdit(); try { tg.close(); } catch (e) { console.error("Error closing WebApp:", e); } });
        console.log("Event listeners added successfully.");
    } catch (e) { console.error("Error adding event listeners:", e); tg.showAlert("Ошибка настройки интерфейса."); }
}

// --- Запуск инициализации ---
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeApp); } else { initializeApp(); }