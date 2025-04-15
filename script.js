// Получаем объект Telegram WebApp в самом начале
const tg = window.Telegram.WebApp;

// --- Функция для установки CSS переменных темы ---
function setThemeClass() {
    console.log("Theme Changed or Initial Load:", tg.themeParams); // Лог для отладки
    console.log("Color Scheme:", tg.colorScheme); // Лог для отладки

    const root = document.documentElement;
    const themeParams = tg.themeParams;

    // Функция для конвертации HEX в RGB строку (например, "255, 255, 255")
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

    // Устанавливаем RGB версии для использования в rgba()
    root.style.setProperty('--tg-theme-bg-color-rgb', hexToRgb(themeParams.bg_color) || '255, 255, 255');
    root.style.setProperty('--tg-theme-text-color-rgb', hexToRgb(themeParams.text_color) || '0, 0, 0');
    root.style.setProperty('--tg-theme-button-color-rgb', hexToRgb(themeParams.button_color) || '64, 167, 227');
    root.style.setProperty('--tg-theme-hint-color-rgb', hexToRgb(themeParams.hint_color) || '153, 153, 153');
    root.style.setProperty('--tg-theme-secondary-bg-color-rgb', hexToRgb(themeParams.secondary_bg_color) || '243, 243, 243');

    // Добавляем/удаляем класс для темной темы
    document.body.classList.toggle('dark', tg.colorScheme === 'dark');
}

// --- Первоначальная настройка и события ---
setThemeClass(); // Вызываем сразу при загрузке
tg.onEvent('themeChanged', setThemeClass); // И при смене темы в Telegram

tg.expand(); // Развернуть окно

// --- Получаем элементы ---
const userInfoDiv = document.getElementById('user-info');
const sendDataBtn = document.getElementById('send-data-btn');
const closeBtn = document.getElementById('close-btn');

// --- Отображение данных пользователя ---
// ВАЖНО: НЕ ИСПОЛЬЗУЙТЕ initDataUnsafe для АВТОРИЗАЦИИ! Только для отображения.
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userInfoDiv.innerHTML = `Привет, <strong>${user.first_name || 'Пользователь'}!</strong> (ID: ${user.id})`;
    // Кнопки станут видимыми благодаря CSS анимации, JS не управляет visibility
} else {
    userInfoDiv.innerHTML = 'Не удалось получить данные (откройте через Telegram).';
    // Кнопки останутся невидимыми (opacity: 0 в CSS)
}

// --- Обработчики кнопок ---
sendDataBtn.addEventListener('click', () => {
    const dataToSend = JSON.stringify({
        action: "send_example_data",
        timestamp: new Date().toISOString()
    });
    tg.sendData(dataToSend);
    tg.HapticFeedback.impactOccurred('light'); // Легкая вибрация
});

closeBtn.addEventListener('click', () => {
    tg.close();
});

// --- Настройка MainButton (опционально) ---
// Если вы хотите использовать главную кнопку Telegram вместо кнопки на странице
/*
if (tg.initDataUnsafe && tg.initDataUnsafe.user) { // Показываем кнопку только если есть пользователь
    tg.MainButton.setText("Отправить через Main Button");
    tg.MainButton.color = tg.themeParams.button_color || '#40a7e3';
    tg.MainButton.textColor = tg.themeParams.button_text_color || '#ffffff';
    tg.MainButton.show(); // Показываем кнопку

    tg.MainButton.onClick(() => {
        if (!tg.MainButton.isVisible || tg.MainButton.isLoading) return;

        tg.MainButton.showProgress();
        tg.MainButton.disable();

        const dataToSend = JSON.stringify({ action: "main_button_click", ts: new Date().toISOString() });
        tg.sendData(dataToSend);

        // Здесь можно показать сообщение и закрыть окно
        tg.showAlert("Данные отправлены через Main Button!", () => {
             tg.MainButton.hideProgress();
             // tg.MainButton.enable(); // Раскомментировать, если нужно отправить еще раз
             // tg.close(); // Раскомментировать для закрытия после отправки
        });
    });
}
*/