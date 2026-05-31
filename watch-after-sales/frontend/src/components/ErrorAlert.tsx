"use client";

import { XCircle, AlertTriangle, Info } from "lucide-react";
import { AppError } from "@/lib/api";

interface ErrorAlertProps {
  error: AppError | null;
  onClose?: () => void;
}

export default function ErrorAlert({ error, onClose }: ErrorAlertProps) {
  if (!error) return null;

  const config = {
    validation: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: AlertTriangle },
    unauthorized: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle },
    conflict: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: AlertTriangle },
  }[error.type] || { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: Info };

  const Icon = config.icon;

  return (
    <div className={`${config.bg} border rounded-lg p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${config.text}`} />
        <span className={`text-sm ${config.text}`}>{error.message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className={`${config.text} hover:opacity-70`}>
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
