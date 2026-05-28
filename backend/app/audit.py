from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import Request

from app import models


class AuditLogger:
    @staticmethod
    def _get_model_fields(model) -> Dict[str, Any]:
        exclude_fields = {'created_at', 'updated_at', 'version'}
        return {
            c.name: getattr(model, c.name)
            for c in model.__table__.columns
            if c.name not in exclude_fields
        }

    @staticmethod
    def log_create(
        db: Session,
        user: models.User,
        resource_type: str,
        resource: Any,
        request: Optional[Request] = None
    ):
        new_values = AuditLogger._get_model_fields(resource)
        log = models.AuditLog(
            user_id=user.id,
            action="create",
            resource_type=resource_type,
            resource_id=resource.id,
            new_values=new_values,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(log)
        db.flush()

    @staticmethod
    def log_update(
        db: Session,
        user: models.User,
        resource_type: str,
        old_resource: Any,
        new_resource: Any,
        request: Optional[Request] = None
    ):
        old_values = AuditLogger._get_model_fields(old_resource)
        new_values = AuditLogger._get_model_fields(new_resource)
        log = models.AuditLog(
            user_id=user.id,
            action="update",
            resource_type=resource_type,
            resource_id=new_resource.id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(log)
        db.flush()

    @staticmethod
    def log_delete(
        db: Session,
        user: models.User,
        resource_type: str,
        resource: Any,
        request: Optional[Request] = None
    ):
        old_values = AuditLogger._get_model_fields(resource)
        log = models.AuditLog(
            user_id=user.id,
            action="delete",
            resource_type=resource_type,
            resource_id=resource.id,
            old_values=old_values,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(log)
        db.flush()

    @staticmethod
    def log_status_change(
        db: Session,
        user: models.User,
        resource_type: str,
        resource: Any,
        old_status: str,
        new_status: str,
        reason: Optional[str] = None,
        request: Optional[Request] = None
    ):
        log = models.AuditLog(
            user_id=user.id,
            action="status_change",
            resource_type=resource_type,
            resource_id=resource.id,
            old_values={"status": old_status, "reason": reason},
            new_values={"status": new_status},
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(log)
        db.flush()


class VersionConflictError(Exception):
    def __init__(self, resource_type: str, resource_id: int, current_version: int, provided_version: int):
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.current_version = current_version
        self.provided_version = provided_version
        super().__init__(
            f"Version conflict for {resource_type} {resource_id}: "
            f"current version is {current_version}, but {provided_version} was provided"
        )


def check_version(current_version: int, provided_version: int, resource_type: str, resource_id: int):
    if current_version != provided_version:
        raise VersionConflictError(resource_type, resource_id, current_version, provided_version)
