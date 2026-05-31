import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  const owner = await prisma.user.upsert({
    where: { id: 'user-owner-001' },
    update: {},
    create: {
      id: 'user-owner-001',
      name: '林店长',
      role: 'OWNER',
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { id: 'user-kitchen-001' },
    update: {},
    create: {
      id: 'user-kitchen-001',
      name: '陈大厨',
      role: 'KITCHEN',
    },
  });

  const cs = await prisma.user.upsert({
    where: { id: 'user-cs-001' },
    update: {},
    create: {
      id: 'user-cs-001',
      name: '王客服',
      role: 'CUSTOMER_SERVICE',
    },
  });

  console.log('用户创建完成');

  const materials = await Promise.all([
    prisma.material.upsert({
      where: { sku: 'MAT-FLOUR-001' },
      update: {},
      create: {
        name: '高筋面粉',
        sku: 'MAT-FLOUR-001',
        category: '面粉',
        unit: 'kg',
        currentStock: 25.5,
        minStock: 10,
        unitPrice: 8.5,
        supplier: '优质粮油批发',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT-BUTTER-001' },
      update: {},
      create: {
        name: '无盐黄油',
        sku: 'MAT-BUTTER-001',
        category: '乳制品',
        unit: 'kg',
        currentStock: 12.3,
        minStock: 5,
        unitPrice: 45.0,
        supplier: '进口食材商行',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT-SUGAR-001' },
      update: {},
      create: {
        name: '细砂糖',
        sku: 'MAT-SUGAR-001',
        category: '糖类',
        unit: 'kg',
        currentStock: 18.0,
        minStock: 8,
        unitPrice: 12.0,
        supplier: '糖业贸易公司',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT-EGG-001' },
      update: {},
      create: {
        name: '新鲜鸡蛋',
        sku: 'MAT-EGG-001',
        category: '蛋类',
        unit: '个',
        currentStock: 150,
        minStock: 60,
        unitPrice: 1.5,
        supplier: '本地农场',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT-YEAST-001' },
      update: {},
      create: {
        name: '干酵母',
        sku: 'MAT-YEAST-001',
        category: '添加剂',
        unit: 'g',
        currentStock: 500,
        minStock: 200,
        unitPrice: 0.15,
        supplier: '烘焙原料批发',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT-MILK-001' },
      update: {},
      create: {
        name: '纯牛奶',
        sku: 'MAT-MILK-001',
        category: '乳制品',
        unit: 'L',
        currentStock: 8.5,
        minStock: 4,
        unitPrice: 12.0,
        supplier: '乳业公司',
      },
    }),
  ]);

  console.log('原料创建完成');

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PROD-BREAD-001' },
      update: {},
      create: {
        name: '经典吐司',
        sku: 'PROD-BREAD-001',
        description: '柔软拉丝的经典白吐司，适合早餐',
        price: 28.0,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-CROISSANT-001' },
      update: {},
      create: {
        name: '黄油可颂',
        sku: 'PROD-CROISSANT-001',
        description: '层层酥脆的法式可颂',
        price: 18.0,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-CAKE-001' },
      update: {},
      create: {
        name: '生日蛋糕',
        sku: 'PROD-CAKE-001',
        description: '6寸奶油水果蛋糕，需提前2天预定',
        price: 168.0,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-COOKIE-001' },
      update: {},
      create: {
        name: '曲奇礼盒',
        sku: 'PROD-COOKIE-001',
        description: '多种口味手工曲奇礼盒',
        price: 58.0,
        isActive: true,
      },
    }),
  ]);

  console.log('产品创建完成');

  await Promise.all([
    prisma.recipeItem.upsert({
      where: { productId_materialId: { productId: products[0].id, materialId: materials[0].id } },
      update: {},
      create: {
        productId: products[0].id,
        materialId: materials[0].id,
        quantity: 0.3,
        unit: 'kg',
      },
    }),
    prisma.recipeItem.upsert({
      where: { productId_materialId: { productId: products[0].id, materialId: materials[1].id } },
      update: {},
      create: {
        productId: products[0].id,
        materialId: materials[1].id,
        quantity: 0.05,
        unit: 'kg',
      },
    }),
    prisma.recipeItem.upsert({
      where: { productId_materialId: { productId: products[0].id, materialId: materials[4].id } },
      update: {},
      create: {
        productId: products[0].id,
        materialId: materials[4].id,
        quantity: 5,
        unit: 'g',
      },
    }),
  ]);

  console.log('配方创建完成');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD202605300001',
      customerName: '张女士',
      customerPhone: '13800138001',
      customerRemark: '吐司要切厚片，谢谢',
      totalAmount: 84.0,
      status: 'COMPLETED',
      pickupDate: yesterday,
      pickupTime: '09:00',
      deliveryType: 'SELF_PICKUP',
      createdById: cs.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            unitPrice: 28.0,
            subtotal: 56.0,
            remark: '切厚片',
          },
          {
            productId: products[1].id,
            quantity: 2,
            unitPrice: 14.0,
            subtotal: 28.0,
          },
        ],
      },
      notes: {
        create: [
          {
            content: '客户来电确认取货时间',
            type: 'CUSTOMER',
            createdById: cs.id,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD202605310002',
      customerName: '李先生',
      customerPhone: '13900139002',
      customerRemark: '奶油少一点，小孩怕甜',
      totalAmount: 168.0,
      status: 'IN_PRODUCTION',
      pickupDate: tomorrow,
      pickupTime: '14:00',
      deliveryType: 'DELIVERY',
      createdById: cs.id,
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 1,
            unitPrice: 168.0,
            subtotal: 168.0,
            remark: '少奶油',
          },
        ],
      },
      notes: {
        create: [
          {
            content: '客户特别要求少奶油，请后厨注意',
            type: 'IMPORTANT',
            createdById: owner.id,
          },
          {
            content: '已收到，会注意的',
            type: 'REPLY',
            createdById: kitchen.id,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNo: 'ORD202605310003',
      customerName: '王小姐',
      customerPhone: '13700137003',
      totalAmount: 58.0,
      status: 'PENDING',
      pickupDate: tomorrow,
      pickupTime: '10:00',
      deliveryType: 'SELF_PICKUP',
      createdById: cs.id,
      items: {
        create: [
          {
            productId: products[3].id,
            quantity: 1,
            unitPrice: 58.0,
            subtotal: 58.0,
          },
        ],
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNo: 'ORD202605310004',
      customerName: '赵先生',
      customerPhone: '13600136004',
      customerRemark: '公司下午茶订单',
      totalAmount: 520.0,
      status: 'CONFIRMED',
      pickupDate: tomorrow,
      pickupTime: '15:00',
      deliveryType: 'DELIVERY',
      createdById: cs.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 10,
            unitPrice: 28.0,
            subtotal: 280.0,
          },
          {
            productId: products[1].id,
            quantity: 15,
            unitPrice: 16.0,
            subtotal: 240.0,
          },
        ],
      },
      notes: {
        create: [
          {
            content: '大客户订单，请注意质量',
            type: 'IMPORTANT',
            createdById: owner.id,
          },
        ],
      },
    },
  });

  const order5 = await prisma.order.create({
    data: {
      orderNo: 'ORD202605300005',
      customerName: '孙女士',
      customerPhone: '13500135005',
      totalAmount: 56.0,
      status: 'REJECTED',
      pickupDate: yesterday,
      pickupTime: '11:00',
      deliveryType: 'SELF_PICKUP',
      rejectReason: '当天订单已满，无法安排',
      createdById: cs.id,
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 1,
            unitPrice: 56.0,
            subtotal: 56.0,
          },
        ],
      },
      notes: {
        create: [
          {
            content: '客户当天早上才订蛋糕，确实来不及，已电话致歉并建议下次提前预约',
            type: 'INTERNAL',
            createdById: cs.id,
          },
        ],
      },
    },
  });

  console.log('订单创建完成');

  const production1 = await prisma.production.create({
    data: {
      orderId: order1.id,
      scheduledDate: yesterday,
      batchNo: 'BAT202605300001',
      status: 'COMPLETED',
      startTime: new Date(yesterday.setHours(6, 0, 0)),
      endTime: new Date(yesterday.setHours(8, 30, 0)),
      yieldQuantity: 4,
      defectiveQuantity: 0,
      operatorId: kitchen.id,
      notes: {
        create: [
          {
            content: '面团发酵效果很好',
            type: 'PRODUCTION',
            createdById: kitchen.id,
          },
        ],
      },
    },
  });

  const production2 = await prisma.production.create({
    data: {
      orderId: order2.id,
      scheduledDate: today,
      batchNo: 'BAT202605310001',
      status: 'IN_PROGRESS',
      startTime: new Date(today.setHours(8, 0, 0)),
      operatorId: kitchen.id,
    },
  });

  console.log('生产记录创建完成');

  await prisma.wasteRecord.create({
    data: {
      productionId: production1.id,
      materialId: materials[0].id,
      quantity: 0.5,
      reason: 'OVERBAKE',
      reasonDetail: '烤箱温度偏高，边缘烤焦了一点',
      unitPrice: 8.5,
      totalAmount: 4.25,
      recordedById: kitchen.id,
    },
  });

  await prisma.wasteRecord.create({
    data: {
      productionId: production1.id,
      materialId: materials[3].id,
      quantity: 5,
      reason: 'DAMAGE',
      reasonDetail: '拿取时不小心打碎',
      unitPrice: 1.5,
      totalAmount: 7.5,
      recordedById: kitchen.id,
    },
  });

  console.log('损耗记录创建完成');

  await prisma.refund.create({
    data: {
      orderId: order5.id,
      refundNo: 'REF202605300001',
      amount: 56.0,
      reason: '订单被拒，全额退款',
      detail: '客户当天早上预订蛋糕，因当天产能已满无法接单，已全额退款',
      status: 'COMPLETED',
      approvedById: owner.id,
      approvedAt: new Date(),
      createdById: cs.id,
    },
  });

  console.log('退款记录创建完成');

  await prisma.stockLog.createMany({
    data: [
      {
        materialId: materials[0].id,
        quantity: 50,
        type: 'PURCHASE',
        reason: '进货',
        operatorId: owner.id,
      },
      {
        materialId: materials[1].id,
        quantity: 20,
        type: 'PURCHASE',
        reason: '进货',
        operatorId: owner.id,
      },
      {
        materialId: materials[0].id,
        quantity: -24.5,
        type: 'USE',
        reason: '生产消耗',
        operatorId: kitchen.id,
      },
    ],
  });

  console.log('库存日志创建完成');

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'ORDER_CREATE',
        entityType: 'Order',
        entityId: order1.id,
        afterValue: JSON.stringify({ orderNo: order1.orderNo }),
        operatorId: cs.id,
      },
      {
        action: 'ORDER_STATUS_CHANGE',
        entityType: 'Order',
        entityId: order1.id,
        beforeValue: JSON.stringify({ status: 'PENDING' }),
        afterValue: JSON.stringify({ status: 'CONFIRMED' }),
        operatorId: owner.id,
      },
      {
        action: 'ORDER_STATUS_CHANGE',
        entityType: 'Order',
        entityId: order1.id,
        beforeValue: JSON.stringify({ status: 'CONFIRMED' }),
        afterValue: JSON.stringify({ status: 'IN_PRODUCTION' }),
        operatorId: kitchen.id,
      },
      {
        action: 'ORDER_STATUS_CHANGE',
        entityType: 'Order',
        entityId: order1.id,
        beforeValue: JSON.stringify({ status: 'IN_PRODUCTION' }),
        afterValue: JSON.stringify({ status: 'COMPLETED' }),
        operatorId: kitchen.id,
      },
    ],
  });

  console.log('审计日志创建完成');

  console.log('种子数据完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
