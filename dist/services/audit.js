"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.checkVersionConflict = checkVersionConflict;
exports.createNotification = createNotification;
const prisma_1 = __importDefault(require("../prisma"));
async function createAuditLog(options) {
    const { entityType, entityId, action, oldValue, newValue, remark, userId } = options;
    await prisma_1.default.auditLog.create({
        data: {
            entityType,
            entityId,
            action,
            oldValue: oldValue ? JSON.stringify(oldValue) : null,
            newValue: newValue ? JSON.stringify(newValue) : null,
            remark,
            userId: userId || null,
        },
    });
}
async function checkVersionConflict(model, id, expectedVersion) {
    const record = await model.findUnique({
        where: { id },
        select: { version: true },
    });
    if (!record)
        return false;
    return record.version !== expectedVersion;
}
async function createNotification(userIds, title, content, type, relatedId) {
    const notifications = userIds.map((userId) => ({
        userId,
        title,
        content,
        type,
        relatedId: relatedId || null,
    }));
    if (notifications.length > 0) {
        await prisma_1.default.notification.createMany({
            data: notifications,
        });
    }
}
//# sourceMappingURL=audit.js.map