import { Router } from 'express';
import { withActor } from '../middleware/auth.js';
import { ROLES } from '../types.js';
import { orderService } from '../services/index.js';

const router = Router();

router.use(withActor);

router.get('/roles', (req, res) => {
  res.json({ roles: ROLES, current: req.actor });
});

router.get('/', (req, res) => {
  const { status, keyword, from, to } = req.query as Record<string, string>;
  const orders = orderService.list({ status, keyword, from, to });
  res.json({ orders });
});

router.get('/:id', (req, res) => {
  const detail = orderService.detail(req.params.id);
  if (!detail) return res.status(404).json({ error: '订单不存在' });
  res.json(detail);
});

router.post('/:id/notes', (req, res) => {
  const { content } = req.body ?? {};
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: '备注内容不能为空' });
  }
  const id = orderService.addNote(req.params.id, String(content), req.actor!.role, req.actor!.name);
  if (!id) return res.status(404).json({ error: '订单不存在' });
  res.json({ id });
});

export default router;
