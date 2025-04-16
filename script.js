// Получаем объект Telegram WebApp в самом начале
const tg = window.Telegram.WebApp;

// --- Глобальные переменные ---
let tasks = []; // Массив для хранения задач

// --- Функция для установки CSS переменных темы ---
function setThemeClass() {
    console.log("Theme Changed or Initial Load:", tg.themeParams);
    console.log("Color Scheme:", tg.colorScheme);

    const root = document.documentElement;
    const themeParams = tg.themeParams;

    const hexToRgb = (hex) => {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };

    // Устанавливаем основные цвета
    root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
    root.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
    root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
    root.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2e7ddb');
    root.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#40a7e3');
    root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
    root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f3f3f3');

    // Устанавливаем RGB версии
    root.style.setProperty('--tg-theme-bg-color-rgb', hexToRgb(themeParams.bg_color) || '255, 255, 255');
    root.style.setProperty('--tg-theme-text-color-rgb', hexToRgb(themeParams.text_color) || '0, 0, 0');
    root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(themeParams.button_color) || '64, 167, 227');
    root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(themeParams.hint_color) || '153, 153, 153');
    root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(themeParams.secondary_bg_color) || '243, 243, 243');

    document.body.classList.toggle('dark', tg.colorScheme === 'dark');
}

// --- Функции для работы со списком задач ---

// Рендер (отображение) списка задач в HTML
function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Очищаем текущий список

    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="no-tasks">Пока задач нет...</li>';
        return;
    }

    tasks.forEach((taskText, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = taskText;
        // Можно добавить data-атрибут для идентификации, если нужно удаление/редактирование
        listItem.dataset.index = index;
        taskList.appendChild(listItem);
        // TODO: В будущем добавить кнопку удаления/редактирования сюда
    });
}

// Добавление новой задачи
function addTask() {
    const input = document.getElementById('new-task-input');
    const taskText = input.value.trim(); // trim() убирает пробелы по краям

    if (taskText === "") {
        tg.showAlert("Пожалуйста, введите текст задачи!");
        return; // Не добавляем пустую задачу
    }

    tasks.push(taskText); // Добавляем в массив
    input.value = ''; // Очищаем поле ввода
    renderTasks(); // Обновляем отображение списка
    tg.HapticFeedback.impactOccurred('light'); // Вибрация при добавлении
}

// --- Первоначальная настройка и события ---
setThemeClass(); // Вызываем сразу при загрузке
tg.onEvent('themeChanged', setThemeClass); // И при смене темы

tg.expand(); // Развернуть окно

// --- Получаем элементы ---
const userInfoDiv = document.getElementById('user-info');
const sendTasksBtn = document.getElementById('send-tasks-btn'); // Переименовали кнопку
const closeBtn = document.getElementById('close-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const newTaskInput = document.getElementById('new-task-input');
const taskListUl = document.getElementById('task-list');

// --- Отображение данных пользователя ---
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userInfoDiv.innerHTML = `Пользователь: <strong>${user.first_name || 'Юзер'}</strong> (ID: ${user.id})`;
} else {
    userInfoDiv.innerHTML = 'Не удалось получить данные пользователя.';
}

// --- Инициализация списка задач ---
// TODO: В будущем здесь можно будет загружать задачи из localStorage
renderTasks(); // Отображаем начальное состояние списка (пустое)

// --- Обработчики событий ---

// Добавление задачи по клику на кнопку
addTaskBtn.addEventListener('click', addTask);

// Добавление задачи по нажатию Enter в поле ввода
newTaskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Предотвращаем стандартное поведение (если есть форма)
        addTask();
    }
});

// Отправка списка задач боту
sendTasksBtn.addEventListener('click', () => {
    if (tasks.length === 0) {
        tg.showAlert("Список задач пуст. Добавьте что-нибудь!");
        return;
    }

    const dataToSend = JSON.stringify({
        action: "send_task_list",
        tasks: tasks, // Отправляем массив задач
        timestamp: new Date().toISOString()
    });

    tg.sendData(dataToSend);
    tg.HapticFeedback.notificationOccurred('success'); // Вибрация успеха
    // Опционально: Очистить список после отправки?
    // tasks = [];
    // renderTasks();
    // tg.showAlert("Список задач отправлен!", () => { tg.close(); }); // Показать сообщение и закрыть
});

// Закрытие Web App
closeBtn.addEventListener('click', () => {
    tg.close();
});

// --- Настройка MainButton (опционально) ---
// Можно настроить MainButton на отправку задач
/*
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    tg.MainButton.setText("Отправить Задачи");
    tg.MainButton.color = tg.themeParams.button_color || '#40a7e3';
    tg.MainButton.textColor = tg.themeParams.button_text_color || '#ffffff';

    // Показываем кнопку только если есть задачи
    function updateMainButtonVisibility() {
         if (tasks.length > 0 && !tg.MainButton.isVisible) {
             tg.MainButton.show();
         } else if (tasks.length === 0 && tg.MainButton.isVisible) {
             tg.MainButton.hide();
         }
    }
    // Вызывать updateMainButtonVisibility() после каждого добавления/удаления задачи и при инициализации

    tg.MainButton.onClick(() => {
        if (!tg.MainButton.isVisible || tg.MainButton.isLoading || tasks.length === 0) return;

        tg.MainButton.showProgress();
        tg.MainButton.disable();

        const dataToSend = JSON.stringify({ action: "main_button_tasks", tasks: tasks, ts: new Date().toISOString() });
        tg.sendData(dataToSend);

        tg.showAlert("Задачи отправлены через Main Button!", () => {
             tg.MainButton.hideProgress();
             // tg.MainButton.enable();
             updateMainButtonVisibility(); // Обновить состояние кнопки
             // tg.close();
        });
    });

    updateMainButtonVisibility(); // Первичная проверка при загрузке
}
*/