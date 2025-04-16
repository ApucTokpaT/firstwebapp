from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, constants
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import json
import logging
import html
from datetime import datetime # Для работы с датами

# --- НАСТРОЙКИ ---
BOT_TOKEN = "7588965175:AAEorKSyas6prFbVf01hf83vLbHsci75p9s"
WEB_APP_URL = "https://ApucTokpaT.github.io/firstwebapp/"
# ----------------

# Логирование
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("telegram.ext").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# --- Хелпер для форматирования даты ---
def format_date_ru(iso_date_str):
    if not iso_date_str:
        return None
    try:
        dt = datetime.fromisoformat(iso_date_str.replace('Z', '+00:00')) # Учитываем часовой пояс
        # Используем более простой формат
        return dt.strftime('%d.%m.%Y')
    except ValueError:
        # Если это не ISO дата, а просто ГГГГ-ММ-ДД (из input type=date)
        try:
            dt = datetime.strptime(iso_date_str, '%Y-%m-%d')
            return dt.strftime('%d.%m.%Y')
        except ValueError:
            logger.warning(f"Could not parse date: {iso_date_str}")
            return None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    logger.info(f"Received /start from user {user.id} ({user.username})")
    keyboard = [[InlineKeyboardButton("📝 Открыть список задач", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(f'Привет, {user.first_name}! Открой список задач:', reply_markup=reply_markup)

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not (update.message and update.message.web_app_data): return

    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    data_str = update.message.web_app_data.data
    logger.info(f"Received WebApp data from user {user_id}: {data_str[:500]}...") # Логируем начало данных

    try:
        data_obj = json.loads(data_str)
        action = data_obj.get("action")

        if action == "send_tasks_to_user":
            tasks_data = data_obj.get("tasks", [])
            logger.info(f"Action '{action}'. Tasks count: {len(tasks_data)}")

            if tasks_data:
                message_text = "<b>📝 Список задач:</b>\n\n"
                # Сортируем задачи для вывода (например, по статусу и приоритету)
                priority_order = {'high': 1, 'medium': 2, 'low': 3}
                tasks_data.sort(key=lambda x: (
                    x.get('completed', False), # Сначала активные
                    priority_order.get(x.get('priority', 'medium'), 2) # Потом по приоритету
                ))

                for i, task in enumerate(tasks_data, 1):
                    # Статус выполнения
                    status_icon = "✅" if task.get('completed', False) else "⏳"
                    # Текст задачи (экранированный)
                    task_text = html.escape(task.get('text', 'Без названия'))
                    if task.get('completed', False):
                        task_text = f"<s>{task_text}</s>" # Перечеркнутый

                    # Приоритет (опционально иконка)
                    priority_text = ""
                    priority = task.get('priority')
                    if priority == 'high': priority_text = " (🔥 Выс)"
                    elif priority == 'low': priority_text = " (💤 Низ)"

                    # Срок выполнения
                    due_date_str = ""
                    formatted_date = format_date_ru(task.get('dueDate'))
                    if formatted_date:
                        due_date_str = f" [срок: {formatted_date}]"

                    # Теги
                    tags_str = ""
                    tags = task.get('tags')
                    if tags and isinstance(tags, list) and len(tags) > 0:
                        safe_tags = [html.escape(tag) for tag in tags]
                        tags_str = f" <small><i>({', '.join(safe_tags)})</i></small>" # Меньшим шрифтом

                    # Собираем строку
                    message_text += f"{status_icon} {task_text}{priority_text}{due_date_str}{tags_str}\n"

                await context.bot.send_message(
                    chat_id=chat_id,
                    text=message_text,
                    parse_mode=constants.ParseMode.HTML
                )
                logger.info(f"Tasks sent to user {user_id}")
            else:
                await context.bot.send_message(chat_id=chat_id, text="Список задач из Web App пуст.")
                logger.info(f"Empty task list from user {user_id}")

        else:
            logger.warning(f"Unknown action '{action}' from user {user_id}")
            await context.bot.send_message(chat_id=chat_id, text=f"Неизвестное действие от Web App: '{action}'")

    except json.JSONDecodeError:
        logger.error(f"JSON Decode Error from user {user_id}: {data_str[:100]}...")
        await context.bot.send_message(chat_id=chat_id, text="🙁 Ошибка формата данных от Web App.")
    except Exception as e:
        logger.exception(f"Error processing WebApp data for user {user_id}: {e}")
        await context.bot.send_message(chat_id=chat_id, text="🙁 Внутренняя ошибка при обработке запроса.")

def main() -> None:
    logger.info("Starting bot...")
    if BOT_TOKEN == "ВАШ_БОТ_ТОКЕН":
        logger.error("ОШИБКА: BOT_TOKEN не установлен!")
        return

    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    logger.info("Bot configured. Running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()