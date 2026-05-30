import db from '../db';
import { Bay, Booking, PaginatedResponse } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';
import { deduct } from './wallet';

export interface BookingFilters {
  member_id?: number;
  member_name_like?: string;
  bay_id?: number;
  status?: string;
  booking_date_start?: string;
  booking_date_end?: string;
  created_by?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateBookingRequest {
  member_id?: number;
  bay_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_amount: number;
  remark?: string;
}

export function getBays(): Bay[] {
  const stmt = db.prepare('SELECT * FROM bays ORDER BY bay_number');
  return stmt.all() as Bay[];
}

export function getBookings(filters: BookingFilters): PaginatedResponse<Booking & { member_name: string; bay_name: string; creator_name: string }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    'b.member_id': filters.member_id,
    'm.name_like': filters.member_name_like,
    'b.bay_id': filters.bay_id,
    'b.status': filters.status,
    'b.booking_date_start': filters.booking_date_start,
    'b.booking_date_end': filters.booking_date_end,
    'b.created_by': filters.created_by
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM bookings b LEFT JOIN members m ON b.member_id = m.id ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const bookingStmt = db.prepare(`
    SELECT b.*, m.name as member_name, bay.name as bay_name, u.name as creator_name
    FROM bookings b
    LEFT JOIN members m ON b.member_id = m.id
    LEFT JOIN bays bay ON b.bay_id = bay.id
    LEFT JOIN users u ON b.created_by = u.id
    ${clause}
    ORDER BY b.booking_date DESC, b.start_time DESC
    LIMIT ? OFFSET ?
  `);

  const items = bookingStmt.all(...params, pageSize, offset) as (Booking & { member_name: string; bay_name: string; creator_name: string })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getBookingById(id: number): (Booking & { member_name: string; bay_name: string }) | undefined {
  const stmt = db.prepare(`
    SELECT b.*, m.name as member_name, bay.name as bay_name
    FROM bookings b
    LEFT JOIN members m ON b.member_id = m.id
    LEFT JOIN bays bay ON b.bay_id = bay.id
    WHERE b.id = ?
  `);
  return stmt.get(id) as (Booking & { member_name: string; bay_name: string }) | undefined;
}

export function createBooking(req: any, operatorId: number, data: CreateBookingRequest) {
  const tx = db.transaction(() => {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (member_id, bay_id, booking_date, start_time, end_time, duration_minutes, total_amount, status, created_by, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?)
    `);

    const result = insertBooking.run(
      data.member_id || null,
      data.bay_id,
      data.booking_date,
      data.start_time,
      data.end_time,
      data.duration_minutes,
      data.total_amount,
      operatorId,
      data.remark || null
    );

    const bookingId = result.lastInsertRowid as number;

    logAudit(
      operatorId,
      'booking',
      'create',
      'booking',
      bookingId,
      null,
      data,
      getClientIp(req),
      req.headers['user-agent']
    );

    return bookingId;
  });

  return tx();
}

export function checkinBooking(req: any, operatorId: number, bookingId: number) {
  const tx = db.transaction(() => {
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error('预约不存在');
    }

    if (booking.status !== 'booked') {
      throw new Error('预约状态不正确');
    }

    if (booking.member_id && booking.total_amount > 0) {
      deduct(req, operatorId, {
        member_id: booking.member_id,
        amount: booking.total_amount,
        source: 'booking',
        source_id: bookingId,
        remark: `球道消费 - ${booking.bay_name}`
      });
    }

    db.prepare(`
      UPDATE bookings
      SET status = 'checked_in',
          checkin_operator_id = ?,
          checkin_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operatorId, bookingId);

    logAudit(
      operatorId,
      'booking',
      'checkin',
      'booking',
      bookingId,
      { status: booking.status },
      { status: 'checked_in' },
      getClientIp(req),
      req.headers['user-agent']
    );

    return getBookingById(bookingId);
  });

  return tx();
}

export function completeBooking(req: any, operatorId: number, bookingId: number) {
  const tx = db.transaction(() => {
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error('预约不存在');
    }

    if (booking.status !== 'checked_in') {
      throw new Error('预约状态不正确，需要先签到');
    }

    db.prepare(`
      UPDATE bookings
      SET status = 'completed',
          complete_operator_id = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operatorId, bookingId);

    logAudit(
      operatorId,
      'booking',
      'complete',
      'booking',
      bookingId,
      { status: booking.status },
      { status: 'completed' },
      getClientIp(req),
      req.headers['user-agent']
    );

    return getBookingById(bookingId);
  });

  return tx();
}

export function getTodayBookingsWithBayStatus(): (Bay & { current_booking: Booking | null })[] {
  const bays = getBays();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT b.*, m.name as member_name
    FROM bookings b
    LEFT JOIN members m ON b.member_id = m.id
    WHERE b.booking_date = ? AND b.status IN ('booked', 'checked_in')
  `);
  const todayBookings = stmt.all(today) as (Booking & { member_name: string })[];

  return bays.map(bay => {
    const currentBooking = todayBookings.find(b => b.bay_id === bay.id) || null;
    return {
      ...bay,
      current_booking: currentBooking
    };
  });
}
