const HTTP_ERROR_TYPES = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
  422: 'UnprocessableEntity',
  429: 'TooManyRequests',
  500: 'InternalServerError',
};

export const sendSuccess = (res, data = null, message = 'Berhasil', statusCode = 200, meta = null) => {
  const responseData = { data, message };

  if (meta) {
    responseData.totalData = meta.total;
    responseData.totalPage = meta.totalPages;
  }

  return res.status(statusCode).json({
    errorStatus: false,
    data: responseData,
  });
};

export const sendError = (res, message = 'Terjadi kesalahan', statusCode = 500, errors = null, errorType = null) => {
  return res.status(statusCode).json({
    errorStatus: true,
    errorType:   errorType || HTTP_ERROR_TYPES[statusCode] || 'InternalServerError',
    errors:      errors || [{ message, code: statusCode }],
  });
};
