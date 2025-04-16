// Получаем объект Telegram WebApp в самом начале
const tg = window.Telegram.WebApp;

// --- Глобальные переменные ---
let tasks = []; // Массив для хранения задач

// --- Функция для установки CSS переменных темы ---
function setThemeClass() {
    console.log("setThemeClass called. Scheme:", tg.colorScheme); // DEBUG
    const root = document.documentElement;
    const themeParams = tg.themeParams;

    const hexToRgb = (hex) => {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };

    // Цвета по умолчанию (если что-то пойдет не так)
    const defaults = {
        light: { bg: '#ffffff', text: '#212529', hint: '#6c757d', link: '#0d6efd', button: '#0d6efd', button_text: '#ffffff', secondary_bg: '#f8f9fa' },
        dark: { bg: '#181e25', text: '#dee2e6', hint: '#adb5bd', link: '#6ea8fe', button: '#0d6efd', button_text: '#ffffff', secondary_bg: '#2a3038' }
    };
    const currentDefaults = tg.colorScheme === 'dark' ? defaults.dark : defaults.light;

    // Устанавливаем основные цвета, используя || оператор для дефолтных значений
    root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || currentDefaults.bg);
    root.style.setProperty('--tg-theme-text-color', themeParams.text_color || currentDefaults.text);
    root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || currentDefaults.hint);
    root.style.setProperty('--tg-theme-link-color', themeParams.link_color || currentDefaults.link);
    root.style.setProperty('--tg-theme-button-color', themeParams.button_color || currentDefaults.button);
    root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || currentDefaults.button_text);
    root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || currentDefaults.secondary_bg);

    // Устанавливаем RGB версии
    root.style.setProperty('--tg-theme-bg-color-rgb', hexToRgb(themeParams.bg_color || currentDefaults.bg) || (tg.colorScheme === 'dark' ? '24, 30, 37' : '255, 255, 255'));
    root.style.setProperty('--tg-theme-text-color-rgb', hexToRgb(themeParams.text_color || currentDefaults.text) || (tg.colorScheme === 'dark' ? '222, 226, 230' : '33, 37, 41'));
    root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(themeParams.hint_color || currentDefaults.hint) || (tg.colorScheme === 'dark' ? '173, 181, 189' : '108, 117, 125'));
    root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(themeParams.button_color || currentDefaults.button) || '13, 110, 253');
    root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(themeParams.secondary_bg_color || currentDefaults.secondary_bg) || (tg.colorScheme === 'dark' ? '42, 48, 56' : '248, 249, 250'));

    // Добавляем/удаляем класс dark
    document.body.classList.toggle('dark', tg.colorScheme === 'dark');
    console.log("Dark class toggled:", document.body.classList.contains('dark')); // DEBUG
}

// --- Функции для работы со списком задач ---

// Рендер (отображение) списка задач в HTML
function renderTasks() {
    console.log("renderTasks called. Current tasks:", tasks); // DEBUG
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error("Error: task-list element not found!"); // DEBUG
        return;
    }
    taskList.innerHTML = ''; // Очищаем текущий список

    if (tasks.length === 0) {
        console.log("No tasks to render, showing 'no tasks' message."); // DEBUG
        taskList.innerHTML = '<li class="no-tasks">Пока задач нет...</li>';
        return;
    }

    tasks.forEach((taskText, index) => {
        console.log(`Rendering task ${index}: ${taskText}`); // DEBUG
        const listItem = document.createElement('li');
        listItem.textContent = taskText;
        listItem.dataset.index = index;
        // Возможно, добавим анимацию появления для каждой задачи
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateY(10px)';
        listItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        taskList.appendChild(listItem);
        // Форсируем перерасчет стилей для анимации
        setTimeout(() => {
            listItem.style.opacity = '1';
            listItem.style.transform = 'translateY(0)';
        }, 10); // Небольшая задержка
    });
    console.log("renderTasks finished."); // DEBUG
}

// Добавление новой задачи
function addTask() {
    console.log("addTask function called."); // DEBUG
    const input = document.getElementById('new-task-input');

    if (!input) {
        console.error("Error: new-task-input element not found!"); // DEBUG
        tg.showAlert("Произошла ошибка: не найдено поле ввода.");
        return;
    }

    const taskText = input.value.trim();
    console.log("Task text from input:", taskText); // DEBUG

    if (taskText === "") {
        console.log("Task text is empty, showing alert."); // DEBUG
        tg.showAlert("Пожалуйста, введите текст задачи!");
        return;
    }

    tasks.push(taskText);
    console.log("Task pushed to array. New tasks array:", tasks); // DEBUG
    input.value = ''; // Очищаем поле ввода
    renderTasks(); // Обновляем отображение списка
    tg.HapticFeedback.impactOccurred('light');
}

// --- Первоначальная настройка и события ---

// Обернем основной код в DOMContentLoaded, чтобы гарантировать доступность DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed."); // DEBUG

    // --- Получаем элементы ---
    const userInfoDiv = document.getElementById('user-info');
    const sendTasksBtn = document.getElementById('send-tasks-btn');
    const closeBtn = document.getElementById('close-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const taskListUl = document.getElementById('task-list'); // Получаем здесь, но используем в renderTasks

    // --- Проверяем, нашлись ли элементы ---
    console.log("Elements:", { userInfoDiv, sendTasksBtn, closeBtn, addTaskBtn, newTaskInput, taskListUl }); // DEBUG
    if (!addTaskBtn || !newTaskInput || !sendTasksBtn || !closeBtn || !taskListUl) {
        console.error("One or more critical elements not found!");
        // Можно показать пользователю сообщение об ошибке
        document.body.innerHTML = '<div style="color: red; padding: 20px;">Ошибка загрузки интерфейса. Пожалуйста, попробуйте перезапустить приложение.</div>';
        return; // Прерываем выполнение, если основных элементов нет
    }

    // --- Установка темы и расширение окна ---
    try {
        setThemeClass(); // Вызываем сразу
        tg.onEvent('themeChanged', setThemeClass); // И при смене темы
        tg.expand(); // Развернуть окно
    } catch (e) {
        console.error("Error initializing Telegram WebApp features:", e);
    }


    // --- Отображение данных пользователя ---
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        if (userInfoDiv) {
             userInfoDiv.innerHTML = `Пользователь: <strong>${user.first_name || 'Юзер'}</strong> (ID: ${user.id})`;
        }
    } else {
         if (userInfoDiv) {
             userInfoDiv.innerHTML = 'Не удалось получить данные пользователя.';
         }
    }

    // --- Инициализация списка задач ---
    renderTasks(); // Отображаем начальное состояние списка

    // --- Обработчики событий ---

    // Добавление задачи по клику на кнопку
    addTaskBtn.addEventListener('click', addTask);
    console.log("Click listener added to addTaskBtn"); // DEBUG

    // Добавление задачи по нажатию Enter в поле ввода
    newTaskInput.addEventListener('keypress', (event) => {
        // console.log("Keypress event:", event.key); // DEBUG (слишком много логов)
        if (event.key === 'Enter') {
            console.log("Enter key pressed in input."); // DEBUG
            event.preventDefault(); // Предотвращаем стандартное поведение
            addTask();
        }
    });
     console.log("Keypress listener added to newTaskInput"); // DEBUG

    // Отправка списка задач боту
    sendTasksBtn.addEventListener('click', () => {
        console.log("sendTasksBtn clicked."); // DEBUG
        if (tasks.length === 0) {
            console.log("Task list is empty, showing alert."); // DEBUG
            tg.showAlert("Список задач пуст. Добавьте что-нибудь!");
            return;
        }

        const dataToSend = JSON.stringify({
            action: "send_task_list",
            tasks: tasks,
            timestamp: new Date().toISOString()
        });
        console.log("Sending data:", dataToSend); // DEBUG

        try {
            tg.sendData(dataToSend);
            tg.HapticFeedback.notificationOccurred('success');
            // Опционально: очистка списка и закрытие
            // tasks = [];
            // renderTasks();
            // tg.showAlert("Список задач отправлен!", () => { tg.close(); });
        } catch (e) {
            console.error("Error sending data:", e);
            tg.showAlert("Ошибка отправки данных.");
        }
    });
    console.log("Click listener added to sendTasksBtn"); // DEBUG

    // Закрытие Web App
    closeBtn.addEventListener('click', () => {
        console.log("closeBtn clicked."); // DEBUG
        try {
             tg.close();
        } catch (e) {
             console.error("Error closing WebApp:", e);
        }
    });
    console.log("Click listener added to closeBtn"); // DEBUG

}); // Конец addEventListener('DOMContentLoaded', ...)