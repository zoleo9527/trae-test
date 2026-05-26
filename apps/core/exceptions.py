from rest_framework import exceptions
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, DatabaseError
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied


class BusinessException(exceptions.APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = '业务处理异常'
    default_code = 'business_error'

    def __init__(self, detail=None, code=None, status_code=None):
        super().__init__(detail, code)
        if status_code:
            self.status_code = status_code


class ValidationException(BusinessException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = '数据校验失败'
    default_code = 'validation_error'


class PermissionDeniedException(BusinessException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = '权限不足'
    default_code = 'permission_denied'


class StatusConflictException(BusinessException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = '状态冲突，操作无法执行'
    default_code = 'status_conflict'


class ResourceNotFoundException(BusinessException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = '资源不存在'
    default_code = 'not_found'


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'code': response.status_code,
            'message': response.data.get('detail', str(exc)),
            'data': None
        }
        return response

    if isinstance(exc, DjangoPermissionDenied):
        return Response({
            'code': status.HTTP_403_FORBIDDEN,
            'message': '权限不足',
            'data': None
        }, status=status.HTTP_403_FORBIDDEN)

    if isinstance(exc, IntegrityError):
        return Response({
            'code': status.HTTP_400_BAD_REQUEST,
            'message': '数据完整性错误，可能存在重复或关联约束',
            'data': None
        }, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, DatabaseError):
        return Response({
            'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'message': '数据库操作异常',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
        'message': f'服务器内部错误: {str(exc)}',
        'data': None
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
