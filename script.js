// В самом начале script.js
const tg = window.Telegram.WebApp;

// Функция для установки CSS переменных темы
function setThemeClass() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    // Добавим secondary_bg_color, если он есть, иначе сделаем чуть темнее/светлее основного
    let secondaryBgColor = tg.themeParams.secondary_bg_color || (tg.colorScheme === 'dark' ? '#3a3a3a' : '#f3f3f3');
     document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', secondaryBgColor);

    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2e7ddb');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#40a7e3');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    document.body.className = tg.colorScheme; // Добавляем класс 'dark' или 'light' к body
}

setThemeClass(); // Вызываем сразу
tg.onEvent('themeChanged', setThemeClass); // И при смене темы

tg.expand(); // Развернуть окно

// ... остальной код script.js ...

// Показываем кнопки после получения данных пользователя
 if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    // ... (код для user-info) ...
    sendDataBtn.style.visibility = 'visible'; // Показываем кнопки
    closeBtn.style.visibility = 'visible';
    // ... (код для MainButton) ...
 } else {
     // ...
     sendDataBtn.style.visibility = 'hidden';
     closeBtn.style.visibility = 'hidden';
 }