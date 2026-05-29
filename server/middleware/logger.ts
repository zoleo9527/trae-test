import morgan from 'morgan';
import dayjs from 'dayjs';

morgan.token('timestamp', () => dayjs().format('YYYY-MM-DD HH:mm:ss'));
morgan.token('user', (req) => {
  return (req as unknown as Record<string, unknown>).user ? 
    JSON.stringify((req as unknown as Record<string, unknown>).user) : 'anonymous';
});

export const requestLogger = morgan(
  '[:timestamp] :method :url :status :response-time ms - :user - :remote-user'
);

export const loggerMiddleware = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
};
