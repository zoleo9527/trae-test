const authService = require('../services/authService');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    const result = await authService.login(
      { username, password, role },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      }
    );
    success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.token, {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, result, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const switchRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const result = await authService.switchRole(req.user.id, role, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, result, 'Role switched successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    success(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    success(res, req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  switchRole,
  changePassword,
  getCurrentUser,
};
