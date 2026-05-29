import dayjs from 'dayjs';

const counters: Record<string, number> = {};

function getDailyCounter(prefix: string): number {
  const key = `${prefix}-${dayjs().format('YYYYMMDD')}`;
  if (!counters[key]) {
    counters[key] = 0;
  }
  counters[key]++;
  return counters[key];
}

export function generateInquiryNo(): string {
  const date = dayjs().format('YYYYMMDD');
  const seq = String(getDailyCounter('XJ')).padStart(3, '0');
  return `XJ${date}${seq}`;
}

export function generateStockLockNo(): string {
  const date = dayjs().format('YYYYMMDD');
  const seq = String(getDailyCounter('SK')).padStart(3, '0');
  return `SK${date}${seq}`;
}

export function generateReturnNo(): string {
  const date = dayjs().format('YYYYMMDD');
  const seq = String(getDailyCounter('TH')).padStart(3, '0');
  return `TH${date}${seq}`;
}

export function generateRefundNo(): string {
  const date = dayjs().format('YYYYMMDD');
  const seq = String(getDailyCounter('TK')).padStart(3, '0');
  return `TK${date}${seq}`;
}
