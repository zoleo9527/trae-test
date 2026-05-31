export interface AppError {
  type: string;
  message: string;
}

const API_BASE = "http://localhost:8080/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function parseError(body: Record<string, unknown>): AppError {
  if (body.type && body.message) {
    return {
      type: (body.type as string) || "unknown",
      message: (body.message as string) || "未知错误",
    };
  }
  const errorObj = body.error as Record<string, unknown> | undefined;
  if (errorObj) {
    return {
      type: (errorObj.type as string) || "unknown",
      message: (errorObj.message as string) || "未知错误",
    };
  }
  return { type: "unknown", message: "未知错误" };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw { type: "unauthorized", message: "登录已过期，请重新登录" } as AppError;
  }

  if (res.status === 204) {
    return {} as T;
  }

  const body = await res.json();

  if (!res.ok) {
    throw parseError(body);
  }

  return body as T;
}

export function downloadCSV(path: string, filename: string) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
}
