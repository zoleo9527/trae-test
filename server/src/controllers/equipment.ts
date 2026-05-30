import { Request, Response } from 'express';
import * as equipmentService from '../services/equipment';
import { BorrowRequest, EquipmentRecordFilters, ReturnRequest } from '../services/equipment';

export async function getEquipments(req: Request, res: Response) {
  const equipments = equipmentService.getEquipments();
  res.json({
    success: true,
    message: '获取成功',
    data: equipments
  });
}

export async function getRecords(req: Request, res: Response) {
  const returnStatus = req.query.return_status as string;
  const filters: EquipmentRecordFilters = {
    member_id: req.query.member_id ? parseInt(req.query.member_id as string) : undefined,
    equipment_id: req.query.equipment_id ? parseInt(req.query.equipment_id as string) : undefined,
    booking_id: req.query.booking_id ? parseInt(req.query.booking_id as string) : undefined,
    return_status: returnStatus && returnStatus !== 'null' ? returnStatus : undefined,
    return_status_is_null: returnStatus === 'null' ? true : undefined,
    borrow_at_start: req.query.borrow_at_start as string,
    borrow_at_end: req.query.borrow_at_end as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = equipmentService.getEquipmentRecords(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function borrow(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: BorrowRequest = req.body;

  if (!data.equipment_id || !data.member_id) {
    return res.status(400).json({
      success: false,
      message: '器材ID和会员ID不能为空'
    });
  }

  try {
    const recordId = equipmentService.borrowEquipment(req, req.user.userId, data);
    res.json({
      success: true,
      message: '借出成功',
      data: { record_id: recordId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function returnEquipment(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: ReturnRequest = req.body;

  if (!data.record_id || !data.return_status) {
    return res.status(400).json({
      success: false,
      message: '记录ID和归还状态不能为空'
    });
  }

  try {
    const recordId = equipmentService.returnEquipment(req, req.user.userId, data);
    res.json({
      success: true,
      message: '归还成功',
      data: { record_id: recordId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}
