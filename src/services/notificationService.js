import { v4 as uuidv4 } from 'uuid';
import { notifications } from '../data/database.js';

export const getMyNotifications = (userId, filters = {}) => {
  let result = notifications.filter(n => n.userId === userId);
  
  if (filters.read !== undefined) {
    result = result.filter(n => n.read === filters.read);
  }
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getUnreadCount = (userId) => {
  return notifications.filter(n => n.userId === userId && !n.read).length;
};

export const markAsRead = (id, userId) => {
  const notification = notifications.find(n => n.id === id && n.userId === userId);
  
  if (!notification) {
    throw new Error('通知不存在');
  }
  
  notification.read = true;
  return notification;
};

export const markAllAsRead = (userId) => {
  notifications
    .filter(n => n.userId === userId && !n.read)
    .forEach(n => { n.read = true; });
  
  return { success: true };
};

export const createNotification = (userId, type, title, content, relatedId = null) => {
  const newNotification = {
    id: `notif-${uuidv4().slice(0, 8)}`,
    userId,
    type,
    title,
    content,
    read: false,
    createdAt: new Date().toISOString(),
    relatedId
  };
  
  notifications.push(newNotification);
  return newNotification;
};
