import { Request, Response } from 'express';
import * as memberService from '../services/member';
import { CreateMemberRequest, MemberFilters } from '../services/member';

export async function getMembers(req: Request, res: Response) {
  const filters: MemberFilters = {
    name_like: req.query.name_like as string,
    phone_like: req.query.phone_like as string,
    member_type: req.query.member_type as string,
    created_at_start: req.query.created_at_start as string,
    created_at_end: req.query.created_at_end as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = memberService.getMembers(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function getMemberById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const member = memberService.getMemberById(id);

  if (!member) {
    return res.status(404).json({
      success: false,
      message: '会员不存在'
    });
  }

  res.json({
    success: true,
    message: '获取成功',
    data: member
  });
}

export async function createMember(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: CreateMemberRequest = req.body;

  if (!data.name || !data.phone) {
    return res.status(400).json({
      success: false,
      message: '姓名和手机号不能为空'
    });
  }

  try {
    const member = memberService.createMember(req, req.user.userId, data);
    res.json({
      success: true,
      message: '创建成功',
      data: member
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function getMemberTimeline(req: Request, res: Response) {
  const memberId = parseInt(req.params.id);
  const timeline = memberService.getMemberTimeline(memberId);

  res.json({
    success: true,
    message: '获取成功',
    data: timeline
  });
}
