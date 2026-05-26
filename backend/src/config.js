const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './data/app.db',
  jwtSecret: process.env.JWT_SECRET || 'trae-test-2-secret-change-me',
  jwtExpiresIn: '24h',
  roles: {
    ADMIN: 'admin',
    STORE_MANAGER: 'store_manager',
    OPTICIAN: 'optician',
    PROCESSOR: 'processor',
    SERVICE: 'service'
  },
  appointmentStatus: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
    OVERDUE: 'overdue'
  },
  orderStatus: {
    PENDING: 'pending',
    LENS_ALLOCATING: 'lens_allocating',
    LENS_ALLOCATED: 'lens_allocated',
    LENS_SHORTAGE: 'lens_shortage',
    PROCESSING: 'processing',
    QUALITY_CHECK: 'quality_check',
    READY: 'ready',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    RETURNED: 'returned',
    REFUNDING: 'refunding',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
  },
  reworkStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REPROCESSING: 'reprocessing',
    COMPLETED: 'completed'
  },
  refundStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
  },
  priority: {
    NORMAL: 'normal',
    URGENT: 'urgent',
    VIP: 'vip'
  }
}

module.exports = config
