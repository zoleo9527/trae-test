export const success = (res, data = null, message = 'Success') => {
  res.json({
    success: true,
    message,
    data,
  });
};

export const error = (res, message = 'Error', statusCode = 400, errors = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const notFound = (res, message = 'Resource not found') => {
  error(res, message, 404);
};

export const unauthorized = (res, message = 'Unauthorized') => {
  error(res, message, 401);
};

export const forbidden = (res, message = 'Forbidden') => {
  error(res, message, 403);
};
