export const getFeedbackStatusBadge = (status) => {
  const statusMap = {
    pending: { class: 'status-pending', label: '待处理' },
    processing: { class: 'status-processing', label: '处理中' },
    resolved: { class: 'status-resolved', label: '已解决' },
    rejected: { class: 'status-rejected', label: '已驳回' },
  }
  const info = statusMap[status] || statusMap.pending
  return { className: 'status-badge ' + info.class, label: info.label }
}

export const getFeedbackTypeLabel = (type) => {
  const typeMap = {
    complaint: '投诉',
    suggestion: '建议',
    praise: '表扬',
    question: '咨询',
  }
  return typeMap[type] || type
}

export const getFeedbackTypeColor = (type) => {
  const colorMap = {
    complaint: 'text-red-600 bg-red-100',
    suggestion: 'text-blue-600 bg-blue-100',
    praise: 'text-green-600 bg-green-100',
    question: 'text-purple-600 bg-purple-100',
  }
  return colorMap[type] || 'text-gray-600 bg-gray-100'
}

export const getReviewNotesDisplay = (notes) => {
  return notes || '暂无说明，点击添加'
}
