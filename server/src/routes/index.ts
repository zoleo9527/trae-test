import { Router } from 'express';
import * as auditLogController from '../controllers/auditLog';
import * as authController from '../controllers/auth';
import * as bookingController from '../controllers/booking';
import * as configController from '../controllers/config';
import * as dashboardController from '../controllers/dashboard';
import * as equipmentController from '../controllers/equipment';
import * as exceptionController from '../controllers/exception';
import * as memberController from '../controllers/member';
import * as reconciliationController from '../controllers/reconciliation';
import * as walletController from '../controllers/wallet';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

router.get('/members', authMiddleware, memberController.getMembers);
router.get('/members/:id', authMiddleware, memberController.getMemberById);
router.post('/members', authMiddleware, memberController.createMember);
router.get('/members/:id/timeline', authMiddleware, memberController.getMemberTimeline);

router.get('/wallet/transactions', authMiddleware, walletController.getTransactions);
router.post('/wallet/recharge', authMiddleware, roleMiddleware(['reception', 'manager']), walletController.recharge);
router.post('/wallet/deduct', authMiddleware, roleMiddleware(['reception', 'manager']), walletController.deduct);

router.get('/bays', authMiddleware, bookingController.getBays);
router.get('/bays/status', authMiddleware, bookingController.getBayStatus);
router.get('/bookings', authMiddleware, bookingController.getBookings);
router.get('/bookings/:id', authMiddleware, bookingController.getBookingById);
router.post('/bookings', authMiddleware, bookingController.createBooking);
router.put('/bookings/:id/checkin', authMiddleware, bookingController.checkinBooking);
router.put('/bookings/:id/complete', authMiddleware, bookingController.completeBooking);

router.get('/equipment', authMiddleware, equipmentController.getEquipments);
router.get('/equipment/records', authMiddleware, equipmentController.getRecords);
router.post('/equipment/borrow', authMiddleware, equipmentController.borrow);
router.post('/equipment/return', authMiddleware, equipmentController.returnEquipment);

router.get('/reconciliation/daily', authMiddleware, reconciliationController.getDaily);
router.post('/reconciliation/generate', authMiddleware, roleMiddleware(['manager']), reconciliationController.generateDaily);
router.get('/reconciliation', authMiddleware, roleMiddleware(['manager']), reconciliationController.getReconciliations);
router.get('/reconciliation/:id/details', authMiddleware, roleMiddleware(['manager']), reconciliationController.getDetails);
router.put('/reconciliation/:id/approve', authMiddleware, roleMiddleware(['manager']), reconciliationController.approve);
router.post('/reconciliation/adjust', authMiddleware, roleMiddleware(['manager']), reconciliationController.adjust);
router.get('/reconciliation/statistics', authMiddleware, roleMiddleware(['manager']), reconciliationController.getStatistics);

router.get('/exceptions', authMiddleware, exceptionController.getExceptions);
router.get('/exceptions/:id', authMiddleware, exceptionController.getExceptionById);
router.post('/exceptions', authMiddleware, exceptionController.createException);
router.put('/exceptions/:id/process', authMiddleware, roleMiddleware(['manager']), exceptionController.processException);

router.get('/audit-logs', authMiddleware, roleMiddleware(['manager']), auditLogController.getAuditLogs);
router.get('/audit-logs/:id', authMiddleware, roleMiddleware(['manager']), auditLogController.getAuditLogById);

router.get('/config/rules', authMiddleware, configController.getRules);
router.put('/config/rules', authMiddleware, roleMiddleware(['manager']), configController.updateRules);

router.get('/dashboard/overview', authMiddleware, roleMiddleware(['manager', 'coach']), dashboardController.getOverview);
router.get('/dashboard/trends', authMiddleware, roleMiddleware(['manager', 'coach']), dashboardController.getTrends);

export default router;
