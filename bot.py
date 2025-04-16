from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, constants # Импортируем константы для ParseMode
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import json
import logging
import html # Импортируем модуль для экранирования HTML

# --- НАСТРОЙКИ ---
# !!! ВАЖНО: Вставьте сюда ВАШ реальный API токен от @BotFather !!!
BOT_TOKEN = "7588965175:AAEorKSyas6prFbVf01hf83vLbHsci75p9s" # Используем ваш токен
# !!! Убедитесь, что URL совпадает с тем, что вы зарегистрировали в @BotFather !!!
WEB_APP_URL = "https://ApucTokpaT.github.io/firstwebapp/" # Используем ваш URL
# ----------------

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("telegram.ext").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправляет приветственное сообщение с кнопкой Web App."""
    user = update.effective_user
    logger.info(f"Получена команда /start от пользователя {user.id} ({user.username})")
    keyboard = [
        [InlineKeyboardButton("📝 Открыть список задач", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f'Привет, {user.first_name}! Нажми кнопку, чтобы открыть список задач:',
        reply_markup=reply_markup
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обрабатывает данные, полученные от Web App."""
    if not (update.message and update.message.web_app_data):
        logger.warning("Получен пустой update в handle_web_app_data, игнорируем.")
        return

    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    data_str = update.message.web_app_data.data
    logger.info(f"Получены данные от Web App (User ID: {user_id}, Chat ID: {chat_id}): {data_str}")

    try:
        data_obj = json.loads(data_str)
        action = data_obj.get("action")

        if action == "send_tasks_to_user":
            tasks = data_obj.get("tasks", [])
            logger.info(f"Действие '{action}'. Задачи: {tasks}")

            if tasks:
                # --- Форматирование текста для пересылки ---
                message_text = "<b>Список задач:</b>\n\n"
                for i, task in enumerate(tasks, 1):
                    safe_task = html.escape(task)
                    message_text += f"{i}. {safe_task}\n"
                # ------------------------------------------

                await context.bot.send_message(
                    chat_id=chat_id,
                    text=message_text,
                    parse_mode=constants.ParseMode.HTML
                )
                logger.info(f"Задачи успешно отправлены пользователю {user_id} для возможной пересылки")
            else:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text="Из Web App был отправлен пустой список задач."
                )
                logger.info(f"Отправлен пустой список задач от пользователя {user_id}")

        else:
            logger.warning(f"Получено неизвестное действие '{action}' от пользователя {user_id}")
            await context.bot.send_message(
                chat_id=chat_id,
                text=f"Получены данные от Web App с неизвестным действием: '{action}'"
            )

    except json.JSONDecodeError:
        logger.error(f"Ошибка декодирования JSON от Web App (User ID: {user_id}): {data_str}")
        await context.bot.send_message(
            chat_id=chat_id,
            text="🙁 Произошла ошибка при обработке данных от Web App (неверный формат JSON)."
        )
    except Exception as e:
        logger.exception(f"Непредвиденная ошибка при обработке данных от Web App (User ID: {user_id}): {e}")
        await context.bot.send_message(
            chat_id=chat_id,
            text="🙁 Произошла внутренняя ошибка при обработке вашего запроса."
        )

def main() -> None:
    """Основная функция запуска бота."""
    logger.info("Запуск бота...")

    # Используем ваш токен
    if BOT_TOKEN == "ВАШ_БОТ_ТОКЕН": # Проверка на дефолтный токен
         logger.error("ОШИБКА: Не указан BOT_TOKEN! Пожалуйста, вставьте ваш API токен.")
         return

    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    logger.info("Бот настроен. Запуск обработки обновлений...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()