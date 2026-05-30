import { Request, Response } from 'express';
import * as bookingService from '../services/booking';
import { BookingFilters, CreateBookingRequest } from '../services/booking';

export async function getBays(req: Request, res: Response) {
  const bays = bookingService.getBays();
  res.json({
    success: true,
    message: '获取成功',
    data: bays
  });
}

export async function getBookings(req: Request, res: Response) {
  const filters: BookingFilters = {
    member_id: req.query.member_id ? parseInt(req.query.member_id as string) : undefined,
    member_name_like: req.query.member_name_like as string,
    bay_id: req.query.bay_id ? parseInt(req.query.bay_id as string) : undefined,
    status: req.query.status as string,
    booking_date_start: req.query.booking_date_start as string,
    booking_date_end: req.query.booking_date_end as string,
    created_by: req.query.created_by ? parseInt(req.query.created_by as string) : undefined,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = bookingService.getBookings(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function getBookingById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const booking = bookingService.getBookingById(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: '预约不存在'
    });
  }

  res.json({
    success: true,
    message: '获取成功',
    data: booking
  });
}

export async function createBooking(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: CreateBookingRequest = req.body;

  if (!data.bay_id || !data.booking_date || !data.start_time || !data.end_time || !data.duration_minutes) {
    return res.status(400).json({
      success: false,
      message: '球道ID、预约日期、开始时间、结束时间、时长不能为空'
    });
  }

  try {
    const bookingId = bookingService.createBooking(req, req.user.userId, data);
    res.json({
      success: true,
      message: '预约创建成功',
      data: { booking_id: bookingId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function checkinBooking(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const id = parseInt(req.params.id);

  try {
    const booking = bookingService.checkinBooking(req, req.user.userId, id);
    res.json({
      success: true,
      message: '签到成功',
      data: booking
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function completeBooking(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const id = parseInt(req.params.id);

  try {
    const booking = bookingService.completeBooking(req, req.user.userId, id);
    res.json({
      success: true,
      message: '完成成功',
      data: booking
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function getBayStatus(req: Request, res: Response) {
  const bays = bookingService.getTodayBookingsWithBayStatus();
  res.json({
    success: true,
    message: '获取成功',
    data: bays
  });
}

export async function calculateBookingAmount(req: Request, res: Response) {
  const { bay_id, booking_date, duration_minutes, member_type } = req.query;

  if (!bay_id || !booking_date || !duration_minutes) {
    return res.status(400).json({
      success: false,
      message: '球道ID、预约日期、时长不能为空'
    });
  }

  try {
    const result = bookingService.calculateBookingAmount(
      parseInt(bay_id as string),
      booking_date as string,
      parseInt(duration_minutes as string),
      (member_type as string) || 'normal'
    );

    res.json({
      success: true,
      message: '计算成功',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}
