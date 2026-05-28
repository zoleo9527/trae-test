import {
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  Warehouse,
  User,
} from 'lucide-react'
import { TimelineEntry } from '../types'
import { formatDateShort } from '../utils'

function getActionIcon(actionType: string) {
  const iconMap: Record<string, React.ReactNode> = {
    order_created: <Package className="w-4 h-4" />,
    order_assigned: <User className="w-4 h-4" />,
    delivery_started: <Truck className="w-4 h-4" />,
    delivery_arrived: <Truck className="w-4 h-4" />,
    delivery_completed: <CheckCircle className="w-4 h-4" />,
    buckets_collected: <RotateCcw className="w-4 h-4" />,
    dispute_raised: <AlertTriangle className="w-4 h-4" />,
    complaint_created: <MessageSquare className="w-4 h-4" />,
    complaint_resolved: <CheckCircle className="w-4 h-4" />,
    redelivery_created: <RefreshCw className="w-4 h-4" />,
    inventory_adjusted: <Warehouse className="w-4 h-4" />,
  }
  return iconMap[actionType] || <Package className="w-4 h-4" />
}

function getActionColor(actionType: string): string {
  const colorMap: Record<string, string> = {
    order_created: 'bg-blue-100 text-blue-600',
    order_assigned: 'bg-purple-100 text-purple-600',
    delivery_started: 'bg-blue-100 text-blue-600',
    delivery_arrived: 'bg-purple-100 text-purple-600',
    delivery_completed: 'bg-green-100 text-green-600',
    buckets_collected: 'bg-green-100 text-green-600',
    dispute_raised: 'bg-red-100 text-red-600',
    complaint_created: 'bg-orange-100 text-orange-600',
    complaint_resolved: 'bg-green-100 text-green-600',
    redelivery_created: 'bg-blue-100 text-blue-600',
    inventory_adjusted: 'bg-yellow-100 text-yellow-600',
  }
  return colorMap[actionType] || 'bg-gray-100 text-gray-600'
}

interface TimelineProps {
  entries: TimelineEntry[]
  maxItems?: number
}

export default function Timeline({ entries, maxItems = 20 }: TimelineProps) {
  const displayEntries = entries.slice(0, maxItems)

  return (
    <div className="space-y-4">
      {displayEntries.map((entry, index) => (
        <div key={entry.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(entry.actionType)}`}>
              {getActionIcon(entry.actionType)}
            </div>
            {index < displayEntries.length - 1 && (
              <div className="w-px h-full bg-gray-200 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-800">{entry.description}</span>
              <span className="text-xs text-gray-400">{formatDateShort(entry.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-500">
              {entry.actorName} · {entry.actorRole === 'station_master' ? '配送站长' : entry.actorRole === 'driver' ? '配送司机' : '客服专员'}
            </p>
            {entry.details && Object.keys(entry.details).length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                {Object.entries(entry.details).map(([key, value]) => (
                  <span key={key} className="mr-3">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
