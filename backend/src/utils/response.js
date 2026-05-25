exports.success = (res, data, message = 'Success', code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

exports.error = (res, message = 'Internal Server Error', code = 500, errors = null) => {
  return res.status(code).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

exports.paginated = (res, data, page, pageSize, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items: data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: parseInt(total),
        totalPages: Math.ceil(total / pageSize),
      },
    },
    timestamp: new Date().toISOString(),
  });
};
