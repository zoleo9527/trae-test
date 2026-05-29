"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdCard = exports.validatePhone = exports.formatCurrency = exports.compareObjects = exports.calculateRentalFee = exports.calculateDaysBetween = exports.generateOrderNo = void 0;
const generateOrderNo = (prefix) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${month}${day}${random}`;
};
exports.generateOrderNo = generateOrderNo;
const calculateDaysBetween = (startDate, endDate) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
};
exports.calculateDaysBetween = calculateDaysBetween;
const calculateRentalFee = (dailyRate, startDate, endDate) => {
    const days = (0, exports.calculateDaysBetween)(startDate, endDate);
    return Number((dailyRate * days).toFixed(2));
};
exports.calculateRentalFee = calculateRentalFee;
const compareObjects = (oldObj, newObj) => {
    const changes = {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    allKeys.forEach((key) => {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes[key] = { old: oldVal, new: newVal };
        }
    });
    return changes;
};
exports.compareObjects = compareObjects;
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const validatePhone = (phone) => {
    return /^1[3-9]\d{9}$/.test(phone);
};
exports.validatePhone = validatePhone;
const validateIdCard = (idCard) => {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
};
exports.validateIdCard = validateIdCard;
