const express = require('express')
const { requireRoles } = require('../middleware/auth')
const { createObjectCsvStringifier } = require('csv-writer')

const router = express.Router()

function buildWhere(req) {
  const { status, materialType, supplierName, startDate, endDate } = req.query
  const where = {}
  if (status) where.status = status
  if (materialType) where.materialType = { contains: materialType }
  if (supplierName) where.supplierName = { contains: supplierName }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
  }
  if (req.user?.stationId) {
    where.stationId = req.user.stationId
  }
  return where
}

router.get('/collections', requireRoles('STATION_OWNER', 'FINANCE', 'WEIGHER'), async (req, res) => {
  const where = buildWhere(req)

  const orders = await req.prisma.collectionOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      station: { select: { name: true } },
      createdBy: { select: { realName: true } },
      weigher: { select: { realName: true } },
      sortingRecords: true,
      priceAdjustments: true,
      settlementRecords: true,
    },
  })

  const statusMap = {
    PENDING: '待处理',
    WEIGHED: '已过磅',
    SORTED: '已分拣入库',
    PRICE_ADJUSTED: '价格已调整',
    SETTLED: '已结算',
    REJECTED: '已驳回',
  }

  const records = orders.map((o) => ({
    单号: o.orderNo,
    供应商: o.supplierName,
    联系电话: o.supplierPhone || '',
    物资类型: o.materialType,
    毛重: Number(o.grossWeight),
    皮重: Number(o.tareWeight),
    净重: Number(o.netWeight),
    单价: Number(o.unitPrice),
    金额: Number(o.totalAmount),
    状态: statusMap[o.status] || o.status,
    站点: o.station?.name || '',
    建单人: o.createdBy?.realName || '',
    过磅员: o.weigher?.realName || '',
    分拣次数: o.sortingRecords.length,
    调价次数: o.priceAdjustments.length,
    是否已结算: o.settlementRecords.length > 0 ? '是' : '否',
    备注: o.remarks || '',
    创建时间: o.createdAt.toISOString().slice(0, 19).replace('T', ' '),
  }))

  const csvStringifier = createObjectCsvStringifier({
    header: Object.keys(records[0] || {}).map((k) => ({ id: k, title: k })),
  })

  const csv = '\uFEFF' + csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="回收单列表_${Date.now()}.csv"`)
  res.send(csv)
})

router.get('/settlements', requireRoles('STATION_OWNER', 'FINANCE'), async (req, res) => {
  const { startDate, endDate, paymentMethod } = req.query
  const where = {}
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (startDate || endDate) {
    where.settledAt = {}
    if (startDate) where.settledAt.gte = new Date(startDate)
    if (endDate) where.settledAt.lte = new Date(endDate + 'T23:59:59')
  }

  if (req.user?.stationId) {
    where.order = { stationId: req.user.stationId }
  }

  const records = await req.prisma.settlementRecord.findMany({
    where,
    orderBy: { settledAt: 'desc' },
    include: {
      settledBy: { select: { realName: true } },
      order: { select: { orderNo: true, supplierName: true, materialType: true, totalAmount: true } },
    },
  })

  const methodMap = { CASH: '现金', BANK: '银行转账', WECHAT: '微信', ALIPAY: '支付宝', OTHER: '其他' }

  const rows = records.map((r) => ({
    单号: r.order?.orderNo || '',
    供应商: r.order?.supplierName || '',
    物资类型: r.order?.materialType || '',
    应收金额: Number(r.order?.totalAmount || 0),
    实结金额: Number(r.amount),
    差额: Number((Number(r.amount) - Number(r.order?.totalAmount || 0)).toFixed(2)),
    支付方式: methodMap[r.paymentMethod] || r.paymentMethod,
    结算人: r.settledBy?.realName || '',
    备注: r.notes || '',
    结算时间: r.settledAt.toISOString().slice(0, 19).replace('T', ' '),
  }))

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.实结金额), 0)
  rows.push({
    单号: '合计', 供应商: '', 物资类型: '', 应收金额: '',
    实结金额: Number(totalAmount.toFixed(2)),
    差额: '', 支付方式: '', 结算人: '', 备注: '', 结算时间: '',
  })

  const csvStringifier = createObjectCsvStringifier({
    header: Object.keys(rows[0] || {}).map((k) => ({ id: k, title: k })),
  })

  const csv = '\uFEFF' + csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="结算记录_${Date.now()}.csv"`)
  res.send(csv)
})

module.exports = router
