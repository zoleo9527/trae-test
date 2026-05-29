"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotesWithTimeline = exports.getEntityNotes = exports.addSupplementNote = exports.addNote = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const enums_1 = require("../types/enums");
const auditService_1 = require("./auditService");
const addNote = async (params) => {
    const { entityType, entityId, content, isSupplement = false, supplementReason, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    const note = await prisma_1.default.note.create({
        data: {
            entityType,
            entityId,
            content,
            isSupplement,
            supplementReason,
            createdBy: operatorId,
        },
        include: {
            creator: {
                select: { id: true, name: true, role: true },
            },
        },
    });
    const response = {
        success: true,
        data: note,
        message: '备注添加成功',
    };
    await (0, auditService_1.createAuditLog)({
        action: isSupplement ? enums_1.AuditAction.NOTE_SUPPLEMENT : enums_1.AuditAction.NOTE_ADD,
        entityType,
        entityId,
        newValue: note,
        remark: isSupplement ? `补录备注: ${content}，原因: ${supplementReason}` : `添加备注: ${content}`,
        operatorId,
        operatorName,
        operatorRole,
        idempotencyKey,
        responseBody: response,
    });
    return note;
};
exports.addNote = addNote;
const addSupplementNote = async (params) => {
    return (0, exports.addNote)({
        ...params,
        isSupplement: true,
    });
};
exports.addSupplementNote = addSupplementNote;
const getEntityNotes = async (entityType, entityId) => {
    return prisma_1.default.note.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        include: {
            creator: {
                select: { id: true, name: true, role: true },
            },
        },
    });
};
exports.getEntityNotes = getEntityNotes;
const getNotesWithTimeline = async (entityType, entityId) => {
    const notes = await (0, exports.getEntityNotes)(entityType, entityId);
    return notes.map((note) => ({
        ...note,
        timelineType: note.isSupplement ? 'SUPPLEMENT' : 'NOTE',
    }));
};
exports.getNotesWithTimeline = getNotesWithTimeline;
