const { ValidationError } = require('../utils/errors');

const validate = (schema, target = 'body') => {
  return async (req, res, next) => {
    try {
      const data = req[target];
      const validated = await schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
      req[target] = validated;
      next();
    } catch (err) {
      const errors = err.inner?.map(e => ({
        field: e.path,
        message: e.message,
      })) || [{ message: err.message }];

      next(new ValidationError('Validation failed', errors));
    }
  };
};

module.exports = validate;
