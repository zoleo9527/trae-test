from apps.tea.models import AuditLog


class AuditService:
    @staticmethod
    def _get_client_ip(request):
        if hasattr(request, 'META'):
            xff = request.META.get('HTTP_X_FORWARDED_FOR')
            if xff:
                return xff.split(',')[0].strip()
            return request.META.get('REMOTE_ADDR', '')
        return ''

    @staticmethod
    def log(instance, action, operator=None, field_name='',
            old_value='', new_value='', request=None):
        model_name = instance.__class__.__name__
        record_id = str(instance.pk)
        record_code = ''
        if hasattr(instance, 'code'):
            record_code = instance.code
        elif hasattr(instance, 'batch_no'):
            record_code = instance.batch_no
        elif hasattr(instance, 'sku'):
            record_code = instance.sku
        ip_address = AuditService._get_client_ip(request) if request else ''
        AuditLog.objects.create(
            model_name=model_name,
            record_id=record_id,
            record_code=record_code,
            action=action,
            field_name=field_name,
            old_value=str(old_value) if old_value else '',
            new_value=str(new_value) if new_value else '',
            operator=operator,
            ip_address=ip_address,
        )

    @staticmethod
    def log_fields(instance, old_data, new_data, operator=None, request=None):
        model_name = instance.__class__.__name__
        record_id = str(instance.pk)
        record_code = ''
        if hasattr(instance, 'code'):
            record_code = instance.code
        elif hasattr(instance, 'batch_no'):
            record_code = instance.batch_no
        elif hasattr(instance, 'sku'):
            record_code = instance.sku
        ip_address = AuditService._get_client_ip(request) if request else ''
        logs = []
        for field_name in set(list(old_data.keys()) + list(new_data.keys())):
            old_val = str(old_data.get(field_name, ''))
            new_val = str(new_data.get(field_name, ''))
            if old_val != new_val:
                logs.append(AuditLog(
                    model_name=model_name,
                    record_id=record_id,
                    record_code=record_code,
                    action='UPDATE',
                    field_name=field_name,
                    old_value=old_val,
                    new_value=new_val,
                    operator=operator,
                    ip_address=ip_address,
                ))
        if logs:
            AuditLog.objects.bulk_create(logs)
