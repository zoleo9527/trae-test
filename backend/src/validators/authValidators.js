const yup = require('yup');
const { Role } = require('../utils/permissions');

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  role: yup.string().oneOf(Object.values(Role), 'Invalid role').required('Role is required'),
});

const switchRoleSchema = yup.object({
  role: yup.string().oneOf(Object.values(Role), 'Invalid role').required('Role is required'),
});

const changePasswordSchema = yup.object({
  oldPassword: yup.string().required('Old password is required'),
  newPassword: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

module.exports = {
  loginSchema,
  switchRoleSchema,
  changePasswordSchema,
};
