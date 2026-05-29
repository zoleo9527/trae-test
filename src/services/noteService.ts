import prisma from '../lib/prisma'
import { EntityType, AuditAction } from '../types/enums'
import { createAuditLog } from './auditService'
import { toJsonString, fromJsonString } from '../lib/jsonUtils'

interface AddNoteParams {
  entityType: EntityType
  entityId: string
  content: string
  isSupplement?: boolean
  supplementReason?: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const addNote = async (params: AddNoteParams) => {
  const {
    entityType,
    entityId,
    content,
    isSupplement = false,
    supplementReason,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  const note = await prisma.note.create({
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
  })

  const response = {
    success: true,
    data: note,
    message: '备注添加成功',
  }

  await createAuditLog({
    action: isSupplement ? AuditAction.NOTE_SUPPLEMENT : AuditAction.NOTE_ADD,
    entityType,
    entityId,
    newValue: note,
    remark: isSupplement ? `补录备注: ${content}，原因: ${supplementReason}` : `添加备注: ${content}`,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
    responseBody: response,
  })

  return note
}

interface AddSupplementNoteParams {
  entityType: EntityType
  entityId: string
  content: string
  supplementReason: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const addSupplementNote = async (params: AddSupplementNoteParams) => {
  return addNote({
    ...params,
    isSupplement: true,
  })
}

export const getEntityNotes = async (entityType: EntityType, entityId: string) => {
  return prisma.note.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: { id: true, name: true, role: true },
      },
    },
  })
}

export const getNotesWithTimeline = async (entityType: EntityType, entityId: string) => {
  const notes = await getEntityNotes(entityType, entityId)
  return notes.map((note: any) => ({
    ...note,
    timelineType: note.isSupplement ? 'SUPPLEMENT' : 'NOTE',
  }))
}
