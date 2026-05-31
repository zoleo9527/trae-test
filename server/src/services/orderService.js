import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class OrderService {
  generateOrderNo() {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async createOrder(data, operatorId, ipAddress, requestId) {
    const { customerName, customerPhone, customerRemark, pickupDate, pickupTime, deliveryType, items } = data;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new Error(`产品不存在: ${item.productId}`);
      }
      const subtotal = product.price.toNumber() * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
        remark: item.remark,
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNo: this.generateOrderNo(),
        customerName,
        customerPhone,
        customerRemark,
        totalAmount,
        pickupDate: new Date(pickupDate),
        pickupTime,
        deliveryType,
        createdById: operatorId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { product: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await auditService.log({
      action: 'ORDER_CREATE',
      entityType: 'Order',
      entityId: order.id,
      afterValue: order,
      operatorId,
      ipAddress,
      requestId,
    });

    return order;
  }

  async getOrders({ status, startDate, endDate, page = 1, pageSize = 20 }) {
    const where = {};
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { include: { product: true } },
          createdBy: { select: { id: true, name: true } },
          production: true,
          notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, pageSize };
  }

  async getOrderDetail(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        production: { include: { wasteRecords: true, notes: true } },
        refund: { include: { createdBy: { select: { id: true, name: true } } } },
        notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  }

  async updateOrder(id, data, operatorId, ipAddress, requestId) {
    const beforeOrder = await this.getOrderDetail(id);
    
    const { items, ...updateData } = data;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: operatorId,
      },
      include: {
        items: { include: { product: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await auditService.logOrderUpdate({
      orderId: id,
      beforeValue: beforeOrder,
      afterValue: order,
      operatorId,
      ipAddress,
      requestId,
    });

    return order;
  }

  async confirmOrder(id, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== 'PENDING') throw new Error('只有待确认的订单可以确认');

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CONFIRMED', updatedById: operatorId },
      });

      const batchNo = `BAT${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      await tx.production.create({
        data: {
          orderId: id,
          scheduledDate: order.pickupDate,
          batchNo,
          status: 'PENDING',
          operatorId: null,
        },
      });

      return updated;
    });

    await auditService.logOrderStatusChange({
      orderId: id,
      beforeStatus: order.status,
      afterStatus: 'CONFIRMED',
      operatorId,
      ipAddress,
      requestId,
    });

    return updatedOrder;
  }

  async rejectOrder(id, rejectReason, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== 'PENDING') throw new Error('只有待确认的订单可以驳回');

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason, updatedById: operatorId },
    });

    await auditService.logOrderStatusChange({
      orderId: id,
      beforeStatus: order.status,
      afterStatus: 'REJECTED',
      operatorId,
      ipAddress,
      requestId,
    });

    return updatedOrder;
  }

  async startProduction(id, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== 'CONFIRMED') throw new Error('只有已确认的订单可以开始生产');

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'IN_PRODUCTION', updatedById: operatorId },
        include: {
          production: true,
        },
      });

      let production = updatedOrder.production[0];

      if (!production) {
        const batchNo = `BAT${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        production = await tx.production.create({
          data: {
            orderId: id,
            scheduledDate: order.pickupDate,
            batchNo,
            status: 'IN_PROGRESS',
            startTime: new Date(),
            operatorId,
          },
        });
      } else {
        production = await tx.production.update({
          where: { id: production.id },
          data: {
            status: 'IN_PROGRESS',
            startTime: new Date(),
            operatorId,
          },
        });
      }

      return { order: updatedOrder, production };
    });

    await auditService.logOrderStatusChange({
      orderId: id,
      beforeStatus: order.status,
      afterStatus: 'IN_PRODUCTION',
      operatorId,
      ipAddress,
      requestId,
    });

    await auditService.log({
      action: 'PRODUCTION_START',
      entityType: 'Production',
      entityId: result.production.id,
      beforeValue: { status: 'PENDING' },
      afterValue: { status: 'IN_PROGRESS', operatorId },
      operatorId,
      ipAddress,
      requestId,
    });

    return {
      ...result.order,
      production: result.production,
    };
  }

  async completeOrder(id, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    if (order.status !== 'IN_PRODUCTION' && order.status !== 'PARTIAL_COMPLETED') {
      throw new Error('只有生产中的订单可以完成');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'COMPLETED', updatedById: operatorId },
    });

    await auditService.logOrderStatusChange({
      orderId: id,
      beforeStatus: order.status,
      afterStatus: 'COMPLETED',
      operatorId,
      ipAddress,
      requestId,
    });

    return updatedOrder;
  }

  async cancelOrder(id, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    if (order.status === 'COMPLETED' || order.status === 'REFUNDED') {
      throw new Error('已完成或已退款的订单不能取消');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', updatedById: operatorId },
    });

    await auditService.logOrderStatusChange({
      orderId: id,
      beforeStatus: order.status,
      afterStatus: 'CANCELLED',
      operatorId,
      ipAddress,
      requestId,
    });

    return updatedOrder;
  }

  async addNote(orderId, content, type, operatorId) {
    const note = await prisma.note.create({
      data: {
        orderId,
        content,
        type,
        createdById: operatorId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return note;
  }
}

export default new OrderService();
