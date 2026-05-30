import { Request, Response } from 'express';
import * as configService from '../services/config';
import { ConfigRules } from '../services/config';

export async function getRules(req: Request, res: Response) {
  const rules = configService.getConfigRules();
  res.json({
    success: true,
    message: '获取成功',
    data: rules
  });
}

export async function updateRules(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const rules: ConfigRules = req.body;

  if (!rules.deduct_priority || !rules.member_discount) {
    return res.status(400).json({
      success: false,
      message: '扣减优先级和会员折扣配置不能为空'
    });
  }

  try {
    const updatedRules = configService.updateConfigRules(req, req.user.userId, rules);
    res.json({
      success: true,
      message: '更新成功',
      data: updatedRules
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}
