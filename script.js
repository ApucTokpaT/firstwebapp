// Получаем объект Telegram WebApp
let tg = window.Telegram.WebApp;

tg.expand(); // Развернуть окно

const userInfoDiv = document.getElementById('user-info');
const sendDataBtn = document.getElementById('send-data-btn');
const closeBtn = document.getElementById('close-btn');

// Показываем НЕБЕЗОПАСНЫЕ данные пользователя (только для отображения!)
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userInfoDiv.innerHTML = `Привет, ${user.first_name || 'Пользователь'}! (ID: ${user.id})`;
    // Можно добавить стилизацию в зависимости от темы
    document.body.style.color = tg.themeParams.text_color || '#000000';
    document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
    // Сделаем кнопки видимыми, если юзер есть
    sendDataBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
} else {
    userInfoDiv.innerHTML = 'Не удалось получить данные пользователя (откройте через Telegram).';
    // Скроем кнопки, если данных нет
    sendDataBtn.style.visibility = 'hidden';
    closeBtn.style.visibility = 'hidden';
}

// Отправка данных боту
sendDataBtn.addEventListener('click', () => {
    const dataToSend = JSON.stringify({
        action: "button_clicked",
        ts: new Date().toISOString()
    });
    tg.sendData(dataToSend);
});

// Закрытие Web App
closeBtn.addEventListener('click', () => {
    tg.close();
});

// Пример: Делаем кнопку "Отправить данные" главной кнопкой Telegram
if (sendDataBtn.style.visibility === 'visible') {
    tg.MainButton.setText("Отправить данные боту");
    tg.MainButton.onClick(() => {
        const dataToSend = JSON.stringify({
            action: "main_button_clicked",
            ts: new Date().toISOString()
        });
        tg.sendData(dataToSend);
    });
    tg.MainButton.show();
}