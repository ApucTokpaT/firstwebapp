from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import json
import logging # Добавим логирование для отладки

# --- НАСТРОЙКИ ---
# !!! ВАЖНО: Вставьте сюда ВАШ реальный API токен от @BotFather !!!
BOT_TOKEN = "7588965175:AAEorKSyas6prFbVf01hf83vLbHsci75p9s"
# !!! Убедитесь, что URL совпадает с тем, что вы зарегистрировали в @BotFather !!!
WEB_APP_URL = "https://ApucTokpaT.github.io/firstwebapp/"
# ----------------

# Настройка логирования (полезно для отладки)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправляет приветственное сообщение с кнопкой Web App."""
    logger.info(f"Получена команда /start от пользователя {update.effective_user.id}")
    # Создаем кнопку, указывая URL нашего Web App
    keyboard = [
        [InlineKeyboardButton("🚀 Открыть Мое Веб-Приложение", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f'Привет, {update.effective_user.first_name}! Нажми кнопку, чтобы запустить Web App:',
        reply_markup=reply_markup
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обрабатывает данные, полученные от Web App."""
    if update.message and update.message.web_app_data:
        user_id = update.message.from_user.id
        data_str = update.message.web_app_data.data
        logger.info(f"Получены данные от Web App (User ID: {user_id}): {data_str}") # Логируем

        try:
            # Пытаемся разобрать как JSON (если вы отправляли JSON из JS)
            data_obj = json.loads(data_str)
            reply_text = f"✅ Спасибо! Web App прислало JSON: {data_obj}"
        except json.JSONDecodeError:
            # Если не JSON, просто показываем как строку
            reply_text = f"✅ Спасибо! Web App прислало текст: {data_str}"

        # Отвечаем пользователю в чат Telegram
        await update.message.reply_text(reply_text)

def main() -> None:
    """Основная функция запуска бота."""
    logger.info("Запуск бота...")

    if BOT_TOKEN == " ":
        logger.error("Ошибка: Не указан BOT_TOKEN! Пожалуйста, вставьте ваш API токен.")
        return # Выходим, если токен не указан

    application = Application.builder().token(BOT_TOKEN).build()

    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    logger.info(f"Бот успешно настроен! Запуск ожидания обновлений...")
    # Запуск бота (он будет работать, пока вы не остановите его Ctrl+C)
    application.run_polling()

if __name__ == '__main__':
    main()