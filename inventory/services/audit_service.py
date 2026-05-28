from django.contrib.contenttypes.models import ContentType
from ..models import AuditLog
import logging

logger = logging.getLogger(__name__)


class AuditService:
    """审计服务 - 记录所有关键操作"""

    @staticmethod
    def log_action(user, action, instance, field_name=None, old_value=None,
                   new_value=None, change_message=None, request=None):
        """记录审计日志"""
        try:
            model_name = instance.__class__.__name__
            object_id = str(instance.pk)
            object_repr = str(instance)[:255]

            ip_address = None
            user_agent = ''
            if request:
                ip_address = getattr(request, '_audit_ip', None)
                user_agent = getattr(request, '_audit_user_agent', '')

            log_entry = AuditLog.objects.create(
                user=user,
                action=action,
                model_name=model_name,
                object_id=object_id,
                object_repr=object_repr,
                field_name=field_name or '',
                old_value=str(old_value) if old_value is not None else '',
                new_value=str(new_value) if new_value is not None else '',
                change_message=change_message or '',
                ip_address=ip_address,
                user_agent=user_agent,
            )
            logger.info(f'Audit log created: {action} on {model_name} {object_id} by {user}')
            return log_entry
        except Exception as e:
            logger.error(f'Failed to create audit log: {str(e)}', exc_info=True)
            return None

    @staticmethod
    def log_create(user, instance, request=None):
        """记录创建操作"""
        return AuditService.log_action(
            user=user,
            action='create',
            instance=instance,
            change_message=f'创建了{instance.__class__._meta.verbose_name}',
            request=request
        )

    @staticmethod
    def log_update(user, instance, changes, request=None):
        """记录更新操作"""
        for field_name, (old_val, new_val) in changes.items():
            AuditService.log_action(
                user=user,
                action='update',
                instance=instance,
                field_name=field_name,
                old_value=old_val,
                new_value=new_val,
                change_message=f'更新字段 {field_name}',
                request=request
            )

    @staticmethod
    def log_delete(user, instance, request=None):
        """记录删除操作"""
        return AuditService.log_action(
            user=user,
            action='delete',
            instance=instance,
            change_message=f'删除了{instance.__class__._meta.verbose_name}',
            request=request
        )

    @staticmethod
    def log_status_change(user, instance, old_status, new_status, request=None, reason=''):
        """记录状态变更"""
        verbose_name = instance.__class__._meta.verbose_name
        message = f'{verbose_name}状态从 {old_status} 变更为 {new_status}'
        if reason:
            message += f'，原因：{reason}'
        return AuditService.log_action(
            user=user,
            action='status_change',
            instance=instance,
            field_name='status',
            old_value=old_status,
            new_value=new_status,
            change_message=message,
            request=request
        )

    @staticmethod
    def log_export(user, model_name, filters, count, request=None):
        """记录导出操作"""
        try:
            ip_address = getattr(request, '_audit_ip', None) if request else None
            user_agent = getattr(request, '_audit_user_agent', '') if request else ''

            return AuditLog.objects.create(
                user=user,
                action='export',
                model_name=model_name,
                object_id='export',
                object_repr=f'导出{model_name}数据{count}条',
                change_message=f'筛选条件: {filters}',
                ip_address=ip_address,
                user_agent=user_agent,
            )
        except Exception as e:
            logger.error(f'Failed to log export: {str(e)}', exc_info=True)
            return None

    @staticmethod
    def get_object_logs(instance):
        """获取对象的审计日志"""
        return AuditLog.objects.filter(
            model_name=instance.__class__.__name__,
            object_id=str(instance.pk)
        ).order_by('-created_at')

    @staticmethod
    def get_user_logs(user, days=30):
        """获取用户的操作日志"""
        from django.utils import timezone
        cutoff = timezone.now() - timezone.timedelta(days=days)
        return AuditLog.objects.filter(
            user=user,
            created_at__gte=cutoff
        ).order_by('-created_at')
