import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { Role } from '../types/enums';
import { serializeJson } from '../utils/transform';

export async function operationLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const originalSend = res.json;
  let responseBody: any;

  res.json = function (body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    try {
      const durationMs = Date.now() - startTime;
      const module = extractModule(req.path);
      const operation = `${req.method} ${req.path}`;

      let resourceType: string | undefined;
      let resourceId: string | undefined;

      const pathMatch = req.path.match(/\/api\/v1\/([^/]+)(?:\/([^/]+))?/);
      if (pathMatch) {
        resourceType = pathMatch[1];
        if (pathMatch[2] && !pathMatch[2].startsWith('?')) {
          resourceId = pathMatch[2];
        }
      }

      await prisma.operationLog.create({
        data: {
          traceId: req.context.traceId,
          operation,
          module,
          resourceType,
          resourceId,
          userId: req.user?.userId || 'anonymous',
          userRole: (req.user?.role as string) || Role.RECEPTIONIST,
          ipAddress: req.context.ip,
          userAgent: req.context.userAgent,
          requestId: req.context.requestId,
          requestBody: serializeJson(req.body),
          responseBody: serializeJson(responseBody),
          statusCode: res.statusCode,
          isSuccess: res.statusCode >= 200 && res.statusCode < 400,
          errorMessage:
            res.statusCode >= 400 ? responseBody?.message : null,
          durationMs,
        },
      });
    } catch (error) {
      console.error('Failed to write operation log:', error);
    }
  });

  next();
}

function extractModule(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 3) {
    return segments[2];
  }
  return 'unknown';
}
