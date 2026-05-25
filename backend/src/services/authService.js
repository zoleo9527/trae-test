const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { AuthenticationError, BusinessError } = require('../utils/errors');
const { Role } = require('../utils/permissions');
const { logAction, AuditAction, EntityType } = require('./auditService');

const generateToken = (user, role) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  const expiresAt = new Date();
  const expiresMatch = expiresIn.match(/(\d+)(h|d|m)/);
  if (expiresMatch) {
    const [, num, unit] = expiresMatch;
    if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + parseInt(num));
    if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + parseInt(num));
    if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(num));
  }

  return { token, expiresAt };
};

const login = async ({ username, password, role }, { ipAddress, userAgent, requestId }) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new AuthenticationError('Invalid username or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('User account is disabled');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid username or password');
  }

  const { token, expiresAt } = generateToken(user, role);

  await prisma.loginToken.create({
    data: {
      userId: user.id,
      token,
      role,
      expiresAt,
    },
  });

  await logAction({
    userId: user.id,
    action: AuditAction.LOGIN,
    entityType: EntityType.USER,
    entityId: user.id,
    changeSummary: `User logged in with role ${role}`,
    ipAddress,
    userAgent,
    requestId,
  });

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role,
      email: user.email,
    },
  };
};

const logout = async (token, { userId, ipAddress, userAgent, requestId }) => {
  await prisma.loginToken.updateMany({
    where: { token },
    data: { revoked: true },
  });

  await logAction({
    userId,
    action: AuditAction.LOGOUT,
    entityType: EntityType.USER,
    entityId: userId,
    ipAddress,
    userAgent,
    requestId,
  });

  return { success: true };
};

const switchRole = async (userId, newRole, { ipAddress, userAgent, requestId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.isActive) {
    throw new AuthenticationError('User account is disabled');
  }

  const { token, expiresAt } = generateToken(user, newRole);

  await prisma.loginToken.create({
    data: {
      userId: user.id,
      token,
      role: newRole,
      expiresAt,
    },
  });

  await logAction({
    userId: user.id,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.USER,
    entityId: user.id,
    fieldName: 'role',
    oldValue: user.role,
    newValue: newRole,
    changeSummary: `Switched role to ${newRole}`,
    ipAddress,
    userAgent,
    requestId,
  });

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: newRole,
      email: user.email,
    },
  };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword) {
    throw new BusinessError('Old password is incorrect', 'INVALID_PASSWORD');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  logger.info(`Password changed for user ${userId}`);

  return { success: true };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return user;
};

module.exports = {
  login,
  logout,
  switchRole,
  changePassword,
  getCurrentUser,
  generateToken,
};
