// Строгий режим для выявления ошибок
"use strict";

// Получаем объект Telegram WebApp в самом начале
const tg = window.Telegram.WebApp;

// --- Глобальные переменные ---
let tasks = []; // Массив для хранения задач

// --- Функция для установки CSS переменных темы ---
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

        // Дефолтные цвета на случай отсутствия themeParams
        const defaults = {
            light: { bg: '#ffffff', text: '#212529', hint: '#6c757d', link: '#0d6efd', button: '#0d6efd', button_text: '#ffffff', secondary_bg: '#f8f9fa' },
            dark: { bg: '#181e25', text: '#ffffff', hint: '#a5acb5', link: '#6ea8fe', button: '#2e7ddb', button_text: '#ffffff', secondary_bg: '#212831' }
        };
        const scheme = tg.colorScheme || 'light';
        const currentDefaults = defaults[scheme];
        const params = themeParams || {}; // Используем пустой объект, если themeParams нет

        // Устанавливаем основные цвета
        root.style.setProperty('--tg-theme-bg-color', params.bg_color || currentDefaults.bg);
        root.style.setProperty('--tg-theme-text-color', params.text_color || currentDefaults.text);
        root.style.setProperty('--tg-theme-hint-color', params.hint_color || currentDefaults.hint);
        root.style.setProperty('--tg-theme-link-color', params.link_color || currentDefaults.link);
        root.style.setProperty('--tg-theme-button-color', params.button_color || currentDefaults.button);
        root.style.setProperty('--tg-theme-button-text-color', params.button_text_color || currentDefaults.button_text);
        root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color || currentDefaults.secondary_bg);

        // Устанавливаем RGB версии
        root.style.setProperty('--tg-theme-bg-color-rgb', hexToRgb(params.bg_color || currentDefaults.bg) || (scheme === 'dark' ? '24, 30, 37' : '255, 255, 255'));
        root.style.setProperty('--tg-theme-text-color-rgb', hexToRgb(params.text_color || currentDefaults.text) || (scheme === 'dark' ? '255, 255, 255' : '33, 37, 41'));
        root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(params.hint_color || currentDefaults.hint) || (scheme === 'dark' ? '165, 172, 181' : '108, 117, 125'));
        root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(params.button_color || currentDefaults.button) || (scheme === 'dark' ? '46, 125, 219' : '13, 110, 253'));
        root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(params.secondary_bg_color || currentDefaults.secondary_bg) || (scheme === 'dark' ? '33, 40, 49' : '248, 249, 250'));

        document.body.classList.toggle('dark', scheme === 'dark');
        console.log("Dark class set:", document.body.classList.contains('dark'));
    } catch (e) {
        console.error("Error in setThemeClass:", e);
    }
}

// --- Функции для работы со списком задач ---

// Рендер списка задач
function renderTasks() {
    console.log("renderTasks called. Tasks:", tasks);
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error("renderTasks Error: task-list element not found!");
        return;
    }
    taskList.innerHTML = ''; // Очищаем

    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="no-tasks visible">Пока задач нет...</li>'; // Добавляем visible
        return;
    }

    tasks.forEach((taskText, index) => {
        try {
            const listItem = document.createElement('li');
            listItem.textContent = taskText;
            listItem.dataset.index = index;
            taskList.appendChild(listItem);
            // Используем setTimeout для запуска CSS-анимации появления
            setTimeout(() => {
                listItem.classList.add('visible');
            }, 10); // Небольшая задержка для срабатывания transition
        } catch (e) {
            console.error(`Error rendering task ${index}:`, e);
        }
    });
    console.log("renderTasks finished.");
}

// Добавление новой задачи
function addTask() {
    console.log("addTask function called.");
    const input = document.getElementById('new-task-input');
    if (!input) {
        console.error("addTask Error: new-task-input element not found!");
        tg.showAlert("Ошибка: Не найдено поле ввода.");
        return;
    }

    try {
        const taskText = input.value.trim();
        console.log("Task text from input:", taskText);

        if (taskText === "") {
            console.log("Task text is empty, showing alert.");
            tg.HapticFeedback.notificationOccurred('warning'); // Вибрация предупреждения
            tg.showAlert("Пожалуйста, введите текст задачи!");
            input.focus(); // Фокус на инпут
            return;
        }

        tasks.push(taskText);
        console.log("Task pushed. New tasks array:", tasks);
        input.value = ''; // Очищаем поле ввода
        renderTasks(); // Обновляем список
        tg.HapticFeedback.impactOccurred('light'); // Вибрация успеха
        // input.focus(); // Опционально: оставляем фокус для быстрого ввода следующей задачи
    } catch (e) {
        console.error("Error in addTask:", e);
        tg.showAlert("Произошла ошибка при добавлении задачи.");
    }
}

// --- Инициализация приложения ---
function initializeApp() {
    console.log("initializeApp called.");

    // --- Получаем критически важные элементы ---
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const sendTasksBtn = document.getElementById('send-tasks-btn');
    const closeBtn = document.getElementById('close-btn');
    const taskListUl = document.getElementById('task-list');
    const userInfoDiv = document.getElementById('user-info');

    // --- Проверка наличия элементов ---
    if (!addTaskBtn || !newTaskInput || !sendTasksBtn || !closeBtn || !taskListUl || !userInfoDiv) {
        console.error("Critical element(s) not found! Aborting initialization.");
        document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Ошибка загрузки интерфейса. Пожалуйста, попробуйте перезапустить приложение.</div>';
        // Попытка уведомить Telegram об ошибке
        try { tg.showAlert("Ошибка загрузки интерфейса."); } catch (e) {}
        return; // Прерываем выполнение
    }
     console.log("All critical elements found.");

    // --- Настройка темы и Telegram API ---
    try {
        setThemeClass(); // Вызываем сразу
        tg.onEvent('themeChanged', setThemeClass);
        tg.expand();
        // Включаем кнопку "Назад", если она нужна
        // tg.BackButton.show();
        // tg.onEvent('backButtonClicked', () => tg.close());

        // Сообщаем Telegram, что приложение готово
        tg.ready();
        console.log("Telegram WebApp SDK initialized and ready.");

    } catch (e) {
        console.error("Error initializing Telegram WebApp features:", e);
        // Показать сообщение пользователю, если tg доступен
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
    } catch(e) {
        console.error("Error displaying user info:", e);
        userInfoDiv.innerHTML = 'Ошибка отображения данных';
    }


    // --- Инициализация списка задач ---
    renderTasks();

    // --- Обработчики событий ---
    try {
        // Кнопка "Добавить"
        addTaskBtn.addEventListener('click', addTask);
        console.log("Listener added to addTaskBtn");

        // Enter в поле ввода
        newTaskInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Важно для предотвращения отправки формы, если она есть
                addTask();
            }
        });
        console.log("Listener added to newTaskInput");

        // Кнопка "Отправить Задачи"
        sendTasksBtn.addEventListener('click', () => {
            console.log("sendTasksBtn clicked.");
            if (tasks.length === 0) {
                tg.HapticFeedback.notificationOccurred('warning');
                tg.showAlert("Список задач пуст.");
                return;
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
                // Можно добавить сообщение об успехе перед закрытием или очисткой
                // tg.showAlert("Задачи отправлены!", () => { /* Действие после */ });
            } catch (e) {
                console.error("Error sending data:", e);
                tg.showAlert("Ошибка отправки данных.");
            }
        });
        console.log("Listener added to sendTasksBtn");

        // Кнопка "Закрыть"
        closeBtn.addEventListener('click', () => {
            console.log("closeBtn clicked.");
            try {
                tg.close();
            } catch (e) {
                console.error("Error closing WebApp:", e);
            }
        });
        console.log("Listener added to closeBtn");

    } catch (e) {
        console.error("Error adding event listeners:", e);
        tg.showAlert("Ошибка настройки кнопок.");
    }
}

// --- Запуск инициализации после загрузки DOM ---
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // `DOMContentLoaded` has already fired
    initializeApp();
}