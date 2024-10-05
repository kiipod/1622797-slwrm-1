# main/apps.py
from django.apps import AppConfig


class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'

    def ready(self):
        import main.signals

# Файл main/apps.py содержит конфигурацию приложения Django. Класс MainConfig, наследуемый от AppConfig,
# используется для настройки специфичных для приложения параметров, таких как имя приложения (name = 'main')
# и использование поля по умолчанию для автоинкрементных полей (default_auto_field).
# Метод ready() Метод ready() вызывается, когда приложение Django полностью загружено.
# Этот метод используется для импорта модуля main.signals.
# Таким образом, подключенные в signals.py сигналы начинают работать при загрузке приложения.
# При загрузке приложения Django метод ready() импортирует main.signals, что позволяет
# зарегистрировать сигналы, указанные в signals.py. Благодаря этому сигналы начинают
# прослушивать соответствующие события (создание, сохранение, удаление объектов) и
# автоматически выполняют свои обработчики.
