const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { loginSchema, switchRoleSchema, changePasswordSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', auth, authController.logout);
router.post('/switch-role', auth, validate(switchRoleSchema), authController.switchRole);
router.post('/change-password', auth, validate(changePasswordSchema), authController.changePassword);
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
