import { v4 as uuidv4 } from 'uuid';

export function generateOrderNo(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${year}${month}${day}${random}`;
}

export function generateRepairOrderNo(): string {
  return generateOrderNo('RO');
}

export function generateApplicationNo(): string {
  return generateOrderNo('PA');
}

export function generateLockNo(): string {
  return generateOrderNo('LK');
}
