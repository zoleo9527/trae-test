import { createObjectCsvStringifier } from 'csv-writer';
import prisma from '../config/prisma.js';
import auditService from './auditService.js';

const exportService = {
  async exportBerthingPlans(filters = {}, userId, format = 'csv') {
    const { status, startDate, endDate, portId } = filters;

    const where = { isLatestVersion: true };
    if (status) where.status = status;
    if (portId) where.portId = portId;
    if (startDate || endDate) {
      where.eta = {};
      if (startDate) where.eta.gte = new Date(startDate);
      if (endDate) where.eta.lte = new Date(endDate);
    }

    const plans = await prisma.berthingPlan.findMany({
      where,
      include: {
        vessel: true,
        port: true,
        terminal: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { eta: 'asc' },
    });

    await auditService.log('EXPORT', 'BerthingPlan', 'batch', userId, {
      newValues: { count: plans.length, format },
      remarks: `导出靠泊计划数据`,
    });

    if (format === 'csv') {
      return this.generateBerthingCSV(plans);
    }

    return plans;
  },

  generateBerthingCSV(plans) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'planNumber', title: '计划编号' },
        { id: 'vesselName', title: '船名' },
        { id: 'imoNumber', title: 'IMO编号' },
        { id: 'port', title: '港口' },
        { id: 'terminal', title: '码头' },
        { id: 'eta', title: '预计到港' },
        { id: 'etd', title: '预计离港' },
        { id: 'status', title: '状态' },
        { id: 'purpose', title: '目的' },
        { id: 'cargoType', title: '货物类型' },
        { id: 'cargoQuantity', title: '货物数量' },
        { id: 'createdBy', title: '创建人' },
        { id: 'createdAt', title: '创建时间' },
      ],
    });

    const records = plans.map(p => ({
      planNumber: p.planNumber,
      vesselName: p.vessel?.name,
      imoNumber: p.vessel?.imoNumber,
      port: p.port?.name,
      terminal: p.terminal?.name,
      eta: p.eta?.toISOString().split('T')[0],
      etd: p.etd?.toISOString().split('T')[0],
      status: p.status,
      purpose: p.purpose,
      cargoType: p.cargoType,
      cargoQuantity: p.cargoQuantity,
      createdBy: p.createdBy?.name,
      createdAt: p.createdAt?.toISOString().split('T')[0],
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  },

  async exportDocuments(filters = {}, userId, format = 'csv') {
    const { status, type, expiryWarning } = filters;

    const where = { isLatestVersion: true };
    if (status) where.status = status;
    if (type) where.type = type;
    if (expiryWarning) {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7);
      where.AND = [
        { expiryDate: { not: null } },
        { expiryDate: { lte: warningDate } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        berthingPlan: {
          include: { vessel: true },
        },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await auditService.log('EXPORT', 'Document', 'batch', userId, {
      newValues: { count: documents.length, format },
      remarks: '导出证件数据',
    });

    if (format === 'csv') {
      return this.generateDocumentCSV(documents);
    }

    return documents;
  },

  generateDocumentCSV(documents) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'type', title: '证件类型' },
        { id: 'title', title: '标题' },
        { id: 'referenceNo', title: '参考编号' },
        { id: 'planNumber', title: '靠泊计划' },
        { id: 'vesselName', title: '船名' },
        { id: 'status', title: '状态' },
        { id: 'issuedDate', title: '签发日期' },
        { id: 'expiryDate', title: '过期日期' },
        { id: 'deadline', title: '截止日期' },
        { id: 'createdBy', title: '创建人' },
      ],
    });

    const records = documents.map(d => ({
      type: d.type,
      title: d.title,
      referenceNo: d.referenceNo,
      planNumber: d.berthingPlan?.planNumber,
      vesselName: d.berthingPlan?.vessel?.name,
      status: d.status,
      issuedDate: d.issuedDate?.toISOString().split('T')[0],
      expiryDate: d.expiryDate?.toISOString().split('T')[0],
      deadline: d.deadline?.toISOString().split('T')[0],
      createdBy: d.createdBy?.name,
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  },

  async exportFees(filters = {}, userId, format = 'csv') {
    const { berthingPlanId, isPaid, category, startDate, endDate } = filters;

    const where = {};
    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const fees = await prisma.fee.findMany({
      where,
      include: {
        berthingPlan: { include: { vessel: true } },
        supplier: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await auditService.log('EXPORT', 'Fee', 'batch', userId, {
      newValues: { count: fees.length, format },
      remarks: '导出费用数据',
    });

    if (format === 'csv') {
      return this.generateFeeCSV(fees);
    }

    return fees;
  },

  generateFeeCSV(fees) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'planNumber', title: '靠泊计划' },
        { id: 'vesselName', title: '船名' },
        { id: 'category', title: '费用类别' },
        { id: 'description', title: '描述' },
        { id: 'amount', title: '金额' },
        { id: 'currency', title: '币种' },
        { id: 'supplier', title: '供应商' },
        { id: 'invoiceNo', title: '发票号' },
        { id: 'isPaid', title: '已支付' },
        { id: 'dueDate', title: '到期日' },
        { id: 'createdBy', title: '创建人' },
      ],
    });

    const records = fees.map(f => ({
      planNumber: f.berthingPlan?.planNumber,
      vesselName: f.berthingPlan?.vessel?.name,
      category: f.category,
      description: f.description,
      amount: f.amount?.toString(),
      currency: f.currency,
      supplier: f.supplier?.name,
      invoiceNo: f.invoiceNo,
      isPaid: f.isPaid ? '是' : '否',
      dueDate: f.dueDate?.toISOString().split('T')[0],
      createdBy: f.createdBy?.name,
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  },

  async exportAuditLogs(filters = {}, userId, format = 'csv') {
    const { entityType, action, startDate, endDate, targetUserId } = filters;

    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (targetUserId) where.userId = targetUserId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    await auditService.log('EXPORT', 'AuditLog', 'batch', userId, {
      newValues: { count: logs.length, format },
      remarks: '导出审计日志',
    });

    if (format === 'csv') {
      return this.generateAuditCSV(logs);
    }

    return logs;
  },

  generateAuditCSV(logs) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'createdAt', title: '时间' },
        { id: 'userName', title: '操作人' },
        { id: 'userRole', title: '角色' },
        { id: 'action', title: '操作' },
        { id: 'entityType', title: '实体类型' },
        { id: 'entityId', title: '实体ID' },
        { id: 'remarks', title: '备注' },
        { id: 'ipAddress', title: 'IP地址' },
      ],
    });

    const records = logs.map(l => ({
      createdAt: l.createdAt?.toISOString(),
      userName: l.user?.name,
      userRole: l.user?.role,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      remarks: l.remarks,
      ipAddress: l.ipAddress,
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  },
};

export default exportService;
