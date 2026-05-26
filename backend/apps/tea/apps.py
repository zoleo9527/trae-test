from django.apps import AppConfig


class TeaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tea'
    verbose_name = '茶叶经销管理'

    def ready(self):
        import apps.tea.signals  # noqa: F401
