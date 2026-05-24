import express from 'express';
import { body, validationResult } from 'express-validator';
import confirmationService from '../services/confirmationService.js';
import { requirePermission, canAccessConfirmation, canAccessConfirmationByRef } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  (req, res) => {
    const confirmations = confirmationService.getConfirmationList(req.query, req.user);
    res.json({ data: confirmations });
  }
);

router.post('/',
  requirePermission('confirmation:confirm'),
  body('type').isIn(['milestone', 'complaint', 'cost', 'change']),
  body('ref_id').notEmpty(),
  body('title').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const confirmation = confirmationService.createConfirmation(req.body, req.user.id, req);
      res.json({ data: confirmation });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  canAccessConfirmation,
  (req, res) => {
    const confirmation = confirmationService.getConfirmationById(req.params.id);
    if (!confirmation) {
      return res.status(404).json({ error: '签认单不存在' });
    }
    res.json({ data: confirmation });
  }
);

router.post('/:id/confirm',
  requirePermission('confirmation:confirm'),
  canAccessConfirmation,
  (req, res) => {
    try {
      const confirmation = confirmationService.confirm(req.params.id, req.user.id, req);
      res.json({ data: confirmation });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/:id/reject',
  requirePermission('confirmation:confirm'),
  canAccessConfirmation,
  (req, res) => {
    try {
      const confirmation = confirmationService.reject(
        req.params.id,
        req.user.id,
        req.body.reason,
        req
      );
      res.json({ data: confirmation });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/ref/:type/:refId',
  canAccessConfirmationByRef,
  (req, res) => {
    const confirmations = confirmationService.getConfirmationsByRef(
      req.params.type,
      req.params.refId
    );
    res.json({ data: confirmations });
  }
);

router.get('/ref/:type/:refId/latest',
  canAccessConfirmationByRef,
  (req, res) => {
    const confirmation = confirmationService.getLatestConfirmation(
      req.params.type,
      req.params.refId
    );
    res.json({ data: confirmation });
  }
);

router.get('/ref/:type/:refId/history',
  canAccessConfirmationByRef,
  (req, res) => {
    const history = confirmationService.getVersionHistory(
      req.params.type,
      req.params.refId
    );
    res.json({ data: history });
  }
);

router.post('/ref/:type/:refId/new-version',
  requirePermission('confirmation:confirm'),
  canAccessConfirmationByRef,
  (req, res) => {
    try {
      const confirmation = confirmationService.createNewVersion(
        req.params.type,
        req.params.refId,
        req.body,
        req.user.id,
        req
      );
      res.json({ data: confirmation });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
