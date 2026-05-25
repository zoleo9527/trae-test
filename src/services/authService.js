import bcrypt from 'bcryptjs';
import { users } from '../data/database.js';
import { generateToken } from '../middleware/auth.js';

export const login = async (username, password) => {
  const user = users.find(u => u.username === username);
  
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  const token = generateToken(user);
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone
    }
  };
};

export const getCurrentUser = (userId) => {
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone
  };
};
