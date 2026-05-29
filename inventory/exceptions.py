from rest_framework.views import exception_handler
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed, NotAuthenticated
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data['code'] = response.status_code
        response.data['message'] = response.data.get('detail', str(exc))
        if 'detail' in response.data:
            del response.data['detail']
    else:
        response = Response(
            {
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': str(exc)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response


class BusinessException(Exception):
    def __init__(self, message, code=400):
        self.message = message
        self.code = code
