const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'ZodError') {
    const errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    error = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: '请求数据验证失败',
      errors,
    };
  }

  if (err.code === 'P2002') {
    const fields = err.meta?.target || [];
    error = {
      statusCode: 409,
      code: 'DUPLICATE_KEY',
      message: `${fields.join(', ')} 已存在`,
    };
  }

  if (err.code === 'P2025') {
    error = {
      statusCode: 404,
      code: 'NOT_FOUND',
      message: '记录不存在或已被删除',
    };
  }

  if (err.code === 'P2003') {
    error = {
      statusCode: 400,
      code: 'FOREIGN_KEY_VIOLATION',
      message: '关联数据无效',
    };
  }

  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: '无效的访问令牌',
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      message: '访问令牌已过期',
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || '服务器内部错误',
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
