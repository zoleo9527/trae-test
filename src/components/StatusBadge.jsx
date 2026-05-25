import { STATUS_MAP, RECEIPT_STATUS_MAP, EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP, RETURN_TYPE_MAP } from '../utils/constants'

export default function StatusBadge({ type, status }) {
  let config = { label: status, color: 'bg-gray-100 text-gray-800' }

  switch (type) {
    case 'status':
      config = STATUS_MAP[status] || config
      break
    case 'receipt':
      config = RECEIPT_STATUS_MAP[status] || config
      break
    case 'exception':
      config = EXCEPTION_TYPE_MAP[status] || config
      break
    case 'exception_status':
      config = EXCEPTION_STATUS_MAP[status] || config
      break
    case 'return_type':
      config = RETURN_TYPE_MAP[status] || config
      break
    default:
      break
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
