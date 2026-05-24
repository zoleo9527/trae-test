import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';

const db = getDB();

export function login(username, password, req = null) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('用户名或密码错误');
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  audit.log('login', 'auth', user.id, user.id, null, { loginAt: new Date().toISOString() }, req);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email
    }
  };
}

export function createUser(userData, creatorId = null, req = null) {
  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(userData.password || '123456', 10);

  const stmt = db.prepare(`
    INSERT INTO users (id, username, password, name, role, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userData.username, hashedPassword, userData.name, userData.role, userData.phone || null, userData.email || null);

  audit.log('create', 'user', id, creatorId, null, { username: userData.username, name: userData.name, role: userData.role }, req);

  return getUserById(id);
}

export function getUserById(id) {
  return db.prepare('SELECT id, username, name, role, phone, email, created_at FROM users WHERE id = ?').get(id);
}

export function getAllUsers() {
  return db.prepare('SELECT id, username, name, role, phone, email, created_at FROM users ORDER BY created_at DESC').all();
}

export function getUsersByRole(role) {
  return db.prepare('SELECT id, username, name, role, phone, email FROM users WHERE role = ? ORDER BY name').all(role);
}

export function updateUser(id, updates, updaterId, req = null) {
  const oldUser = getUserById(id);
  if (!oldUser) {
    throw new Error('用户不存在');
  }

  const fields = [];
  const values = [];

  if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.phone) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.email) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.password) {
    fields.push('password = ?');
    values.push(bcrypt.hashSync(updates.password, 10));
  }

  if (fields.length === 0) return oldUser;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const newUser = getUserById(id);
  audit.log('update', 'user', id, updaterId, oldUser, newUser, req);

  return newUser;
}

export function getRoleStats() {
  return db.prepare(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
  `).all();
}

export default { login, createUser, getUserById, getAllUsers, getUsersByRole, updateUser, getRoleStats };
