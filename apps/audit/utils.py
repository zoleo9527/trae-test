from typing import Any, Dict, Optional
from django.contrib.auth.models import User
from django.db import models
from .models import AuditLog


def log_action(
    user: Optional[User],
    action: str,
    message: str,
    instance: Optional[models.Model] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    request: Optional[Any] = None,
) -> AuditLog:
    ip_address = None
    user_agent = None
    path = None
    method = None

    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        path = request.path
        method = request.method

    model_name = None
    object_id = None
    object_repr = None

    if instance:
        model_name = instance.__class__.__name__
        object_id = str(instance.pk)
        object_repr = str(instance)[:255]

    audit_log = AuditLog.objects.create(
        user=user,
        username=user.username if user else None,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        ip_address=ip_address,
        user_agent=user_agent,
        path=path,
        method=method,
        message=message,
        old_values=old_values,
        new_values=new_values,
    )

    return audit_log


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def model_to_dict(instance: models.Model, fields: Optional[list] = None) -> Dict[str, Any]:
    data = {}
    opts = instance._meta
    for f in opts.fields:
        if fields and f.name not in fields:
            continue
        if isinstance(f, models.ForeignKey):
            data[f.name] = getattr(instance, f'{f.name}_id')
        else:
            value = getattr(instance, f.name)
            if hasattr(value, 'strftime'):
                data[f.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                data[f.name] = str(value)
    return data
