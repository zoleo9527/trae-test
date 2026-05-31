import time
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response: Response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 2)

        if request.url.path.startswith("/api") and request.method in ("POST", "PUT", "PATCH", "DELETE"):
            access_log = {
                "method": request.method,
                "path": request.url.path,
                "query": str(request.query_params),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            }
            print(f"[AUDIT-ACCESS] {json.dumps(access_log, ensure_ascii=False)}")

        return response
