import { Router } from 'express';
import { z } from 'zod';
import documentService from '../services/documentService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createDocumentSchema = z.object({
  berthingPlanId: z.string().min(1, '靠泊计划ID不能为空'),
  type: z.enum(['CREW_MANIFEST', 'CARGO_MANIFEST', 'SHIP_REGISTRATION', 'SAFETY_CERTIFICATE', 'PORT_CLEARANCE', 'CUSTOMS_DECLARATION']),
  title: z.string().min(1, '标题不能为空'),
  referenceNo: z.string().optional(),
  deadline: z.string().optional(),
  remarks: z.string().optional(),
});

const updateDocumentSchema = z.object({
  type: z.enum(['CREW_MANIFEST', 'CARGO_MANIFEST', 'SHIP_REGISTRATION', 'SAFETY_CERTIFICATE', 'PORT_CLEARANCE', 'CUSTOMS_DECLARATION']).optional(),
  title: z.string().optional(),
  referenceNo: z.string().optional().nullable(),
  issuedBy: z.string().optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED']),
  reason: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      berthingPlanId: req.query.berthingPlanId,
      status: req.query.status,
      type: req.query.type,
      expiryWarning: req.query.expiryWarning === 'true',
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await documentService.getDocuments(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/expiring', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const documents = await documentService.getExpiringDocuments(days);
    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const document = await documentService.getDocument(req.params.id);
    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chain/:chainId', async (req, res, next) => {
  try {
    const documents = await documentService.getDocumentByChain(req.params.chainId);
    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAnyRole(['DOCUMENT_SPECIALIST', 'AGENT_MANAGER']), async (req, res, next) => {
  try {
    const data = createDocumentSchema.parse(req.body);
    const ipAddress = req.ip;
    const document = await documentService.createDocument(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAnyRole(['DOCUMENT_SPECIALIST', 'AGENT_MANAGER']), async (req, res, next) => {
  try {
    const data = updateDocumentSchema.parse(req.body);
    const ipAddress = req.ip;
    const document = await documentService.updateDocument(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', idempotencyMiddleware, requireAnyRole(['DOCUMENT_SPECIALIST', 'AGENT_MANAGER']), async (req, res, next) => {
  try {
    const { status, reason } = statusSchema.parse(req.body);
    const ipAddress = req.ip;
    const document = await documentService.updateStatus(req.params.id, status, req.user.id, ipAddress, reason);
    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
