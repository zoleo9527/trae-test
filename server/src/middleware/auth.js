import { forbidden, unauthorized } from '../utils/response.js';

const USER_MOCK = {
  'owner-token': { id: 'user-owner-001', name: '林店长', role: 'OWNER' },
  'kitchen-token': { id: 'user-kitchen-001', name: '陈大厨', role: 'KITCHEN' },
  'cs-token': { id: 'user-cs-001', name: '王客服', role: 'CUSTOMER_SERVICE' },
};

export const auth = (req, res, next) => {
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return unauthorized(res, '缺少认证令牌');
  }

  const user = USER_MOCK[token];
  if (!user) {
    return unauthorized(res, '无效的认证令牌');
  }

  req.user = user;
  next();
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, '未登录');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, `需要以下角色之一: ${roles.join(', ')}`);
    }

    next();
  };
};
