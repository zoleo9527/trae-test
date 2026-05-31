import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContext {
  traceId: string;
  requestId: string;
  startTime: number;
  userId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  const requestId = uuidv4();
  
  req.context = {
    traceId,
    requestId,
    startTime: Date.now(),
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-Request-Id', requestId);

  next();
}
