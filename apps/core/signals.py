from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models_audit import AuditLog


@receiver(pre_save)
def track_model_changes(sender, instance, **kwargs):
    if sender.__module__.startswith('apps.') and hasattr(instance, 'pk') and instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            old_values = {}
            new_values = {}

            for field in instance._meta.fields:
                if field.name not in ['created_at', 'updated_at']:
                    old_val = getattr(old_instance, field.name)
                    new_val = getattr(instance, field.name)
                    if old_val != new_val:
                        old_values[field.name] = str(old_val)
                        new_values[field.name] = str(new_val)

            if old_values or new_values:
                from django.contrib.auth import get_user
                import inspect
                user = None
                for frame in inspect.stack():
                    request = frame.frame.f_locals.get('request')
                    if request and hasattr(request, 'user') and request.user.is_authenticated:
                        user = request.user
                        break

                AuditLog.objects.create(
                    user=user,
                    action=AuditLog.Action.STATUS_CHANGE if 'status' in old_values or 'status' in new_values else AuditLog.Action.UPDATE,
                    content_type=ContentType.objects.get_for_model(sender),
                    object_id=instance.pk,
                    object_repr=str(instance),
                    old_value=old_values,
                    new_value=new_values
                )
        except Exception:
            pass
