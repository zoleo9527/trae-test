from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, transaction
import logging

logger = logging.getLogger(__name__)


class BusinessException(APIException):
    """业务异常基类"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = '业务处理异常'
    default_code = 'business_error'

    def __init__(self, detail=None, code=None, status_code=None):
        super().__init__(detail, code)
        if status_code:
            self.status_code = status_code


class ValidationFailedException(BusinessException):
    """校验失败异常"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'validation_failed'


class StatusConflictException(BusinessException):
    """状态冲突异常"""
    status_code = status.HTTP_409_CONFLICT
    default_code = 'status_conflict'


class PermissionDeniedException(BusinessException):
    """权限不足异常"""
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'permission_denied'


class ResourceNotFoundException(BusinessException):
    """资源不存在异常"""
    status_code = status.HTTP_404_NOT_FOUND
    default_code = 'not_found'


class InventoryShortageException(BusinessException):
    """库存不足异常"""
    status_code = status.HTTP_409_CONFLICT
    default_code = 'inventory_shortage'


class ProductDelistedException(BusinessException):
    """商品已下架异常"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'product_delisted'


class CollaborationSyncException(BusinessException):
    """联名商品同步异常"""
    status_code = status.HTTP_409_CONFLICT
    default_code = 'collaboration_sync_error'


class DataDeviationException(BusinessException):
    """数据偏差异常"""
    status_code = status.HTTP_409_CONFLICT
    default_code = 'data_deviation'


def custom_exception_handler(exc, context):
    """自定义全局异常处理器"""
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, ValidationError):
            response.data = {
                'code': 'validation_failed',
                'message': '数据校验失败',
                'details': response.data,
                'suggestion': _get_validation_suggestion(response.data)
            }
        elif isinstance(exc, PermissionDenied):
            response.data = {
                'code': 'permission_denied',
                'message': '权限不足',
                'details': str(exc.detail) if hasattr(exc, 'detail') else '您没有执行此操作的权限',
                'suggestion': '请联系管理员获取相应权限，或使用正确的账号登录'
            }
        elif isinstance(exc, BusinessException):
            response.data = {
                'code': exc.default_code,
                'message': str(exc.detail),
                'details': None,
                'suggestion': _get_business_suggestion(exc.default_code)
            }
        else:
            response.data = {
                'code': exc.default_code if hasattr(exc, 'default_code') else 'error',
                'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
                'details': None,
                'suggestion': '请稍后重试或联系技术支持'
            }
        return response

    if isinstance(exc, IntegrityError):
        logger.error(f'IntegrityError: {str(exc)}', exc_info=True)
        return Response({
            'code': 'integrity_error',
            'message': '数据完整性约束冲突',
            'details': str(exc),
            'suggestion': '请检查数据是否重复或关联数据是否存在'
        }, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, transaction.TransactionManagementError):
        logger.error(f'TransactionError: {str(exc)}', exc_info=True)
        return Response({
            'code': 'transaction_error',
            'message': '事务处理异常',
            'details': str(exc),
            'suggestion': '请稍后重试'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    logger.error(f'Unhandled exception: {str(exc)}', exc_info=True)
    return Response({
        'code': 'internal_error',
        'message': '服务器内部错误',
        'details': str(exc) if status.HTTP_500_INTERNAL_SERVER_ERROR else None,
        'suggestion': '请联系技术支持'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _get_validation_suggestion(errors):
    """根据校验错误给出建议"""
    suggestions = []
    if isinstance(errors, dict):
        for field, msgs in errors.items():
            if isinstance(msgs, list):
                suggestions.append(f'{field}: {"; ".join(str(m) for m in msgs)}')
    return '请修正以上问题后重试: ' + '; '.join(suggestions) if suggestions else '请检查输入数据'


def _get_business_suggestion(code):
    """根据业务异常代码给出建议"""
    suggestions = {
        'status_conflict': '当前单据状态不允许执行此操作，请刷新页面确认最新状态',
        'permission_denied': '请联系管理员获取相应权限',
        'inventory_shortage': '库存不足，请调整数量或先补货',
        'product_delisted': '该商品已下架，无法进行此操作',
        'data_deviation': '数据存在偏差，请先进行库存盘点校准',
        'not_found': '请求的资源不存在，请检查ID是否正确',
    }
    return suggestions.get(code, '请检查操作是否正确或联系管理员')
