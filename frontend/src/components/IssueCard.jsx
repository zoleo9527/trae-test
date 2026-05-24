import { severityConfig } from '../utils/format'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function IssueCard({ issue }) {
  const severity = severityConfig[issue.severity] || severityConfig.medium

  return (
    <div className={`rounded-lg border p-4 ${issue.is_rectified ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {issue.is_rectified ? (
              <CheckCircle size={18} className="text-green-500" />
            ) : (
              <AlertTriangle size={18} className="text-orange-500" />
            )}
            <h4 className="font-medium text-gray-900">{issue.title}</h4>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severity.color}`}>
              {severity.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{issue.description}</p>
          {issue.position && (
            <p className="mt-1 text-xs text-gray-500">位置：{issue.position}</p>
          )}
        </div>
      </div>
    </div>
  )
}
