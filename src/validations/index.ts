import Joi from 'joi';
import {
  HARVEST_STATUS,
  MAINTENANCE_TYPE,
  DISEASE_SEVERITY,
  VISIT_RESULT,
  NEGOTIATION_STATUS,
} from '../types';

export const loginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': '用户名不能为空',
      'any.required': '用户名是必填项',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': '密码不能为空',
      'string.min': '密码长度不能少于6位',
      'any.required': '密码是必填项',
    }),
  }),
});

export const createHarvestSchema = Joi.object({
  body: Joi.object({
    plotId: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().optional(),
    scheduledDate: Joi.date().required(),
    targetQuantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().optional(),
  }),
});

export const updateHarvestStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(HARVEST_STATUS))
      .required(),
    actualQuantity: Joi.number().integer().min(1).when('status', {
      is: HARVEST_STATUS.COMPLETED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    qualityGrade: Joi.string().optional(),
    rejectionReason: Joi.string().when('status', {
      is: HARVEST_STATUS.REJECTED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
});

export const createLoadingSchema = Joi.object({
  body: Joi.object({
    harvestId: Joi.string().uuid().required(),
    loadingDate: Joi.date().required(),
    vehicleNo: Joi.string().required(),
    driverName: Joi.string().optional(),
    quantity: Joi.number().integer().min(1).required(),
    checkedBy: Joi.string().optional(),
    customerName: Joi.string().required(),
    orderNo: Joi.string().optional(),
    discrepancyNote: Joi.string().optional(),
  }),
});

export const createMaintenanceSchema = Joi.object({
  body: Joi.object({
    plotId: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().optional(),
    maintenanceDate: Joi.date().required(),
    type: Joi.string()
      .valid(...Object.values(MAINTENANCE_TYPE))
      .required(),
    durationMinutes: Joi.number().integer().min(1).required(),
    weather: Joi.string().optional(),
    dosage: Joi.string().optional(),
    notes: Joi.string().optional(),
    needsReview: Joi.boolean().default(false),
  }),
});

export const reviewMaintenanceSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    reviewNote: Joi.string().required(),
    needsFollowUp: Joi.boolean().default(false),
  }),
});

export const createDiseaseReportSchema = Joi.object({
  body: Joi.object({
    plotId: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().optional(),
    discoveredDate: Joi.date().required(),
    symptoms: Joi.string().required(),
    severity: Joi.string()
      .valid(...Object.values(DISEASE_SEVERITY))
      .required(),
    affectedArea: Joi.number().min(0).optional(),
    suspectedCause: Joi.string().optional(),
    initialAction: Joi.string().optional(),
    followUpDate: Joi.date().optional(),
  }),
});

export const resolveDiseaseSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    resolutionNote: Joi.string().required(),
  }),
});

export const createVisitSchema = Joi.object({
  body: Joi.object({
    loadingId: Joi.string().uuid().optional(),
    customerName: Joi.string().required(),
    customerPhone: Joi.string().required(),
    visitDate: Joi.date().required(),
    visitType: Joi.string().required(),
    result: Joi.string()
      .valid(...Object.values(VISIT_RESULT))
      .required(),
    feedback: Joi.string().required(),
    hasComplaint: Joi.boolean().default(false),
    complaintDetail: Joi.string().when('hasComplaint', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    followUpDate: Joi.date().optional(),
  }),
});

export const markFollowedUpSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    followUpNote: Joi.string().required(),
  }),
});

export const createNegotiationSchema = Joi.object({
  body: Joi.object({
    visitId: Joi.string().uuid().required(),
    customerName: Joi.string().required(),
    customerComplaint: Joi.string().required(),
    proposedReseedQty: Joi.number().integer().min(1).required(),
    proposedReseedDate: Joi.date().optional(),
  }),
});

export const updateNegotiationStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    newStatus: Joi.string()
      .valid(...Object.values(NEGOTIATION_STATUS))
      .required(),
    changeReason: Joi.string().optional(),
    rejectionReason: Joi.string().when('newStatus', {
      is: NEGOTIATION_STATUS.REJECTED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    reworkNote: Joi.string().when('newStatus', {
      is: NEGOTIATION_STATUS.REWORK_REQUIRED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    managerNote: Joi.string().optional(),
    actualReseedQty: Joi.number().integer().min(1).when('newStatus', {
      is: NEGOTIATION_STATUS.COMPLETED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    actualReseedDate: Joi.date().when('newStatus', {
      is: NEGOTIATION_STATUS.COMPLETED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    confirmationNote: Joi.string().when('newStatus', {
      is: NEGOTIATION_STATUS.CUSTOMER_CONFIRMED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
});

export const completeTodoSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
});

export const paginationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
});
