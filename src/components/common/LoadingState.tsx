import React from 'react'

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg className={`animate-spin ${sizeClasses[size]} text-primary-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export const SkeletonCard: React.FC = () => (
  <div className="card p-4 animate-pulse">
    <div className="h-4 bg-dark-200 rounded w-3/4 mb-3" />
    <div className="h-3 bg-dark-100 rounded w-1/2 mb-2" />
    <div className="h-3 bg-dark-100 rounded w-2/3" />
  </div>
)

export const SkeletonRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="table-cell">
        <div className={`h-4 bg-dark-200 rounded ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
      </td>
    ))}
  </tr>
)

export const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center py-32">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-dark-500">加载中...</p>
    </div>
  </div>
)
