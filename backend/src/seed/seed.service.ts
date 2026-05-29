import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as uuid from 'uuid';
import { DbService } from '../db/db.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private db: DbService) {}

  async onModuleInit() {
    const userCount = this.db.count('users');
    if (userCount === 0) {
      console.log('正在生成演示数据...');
      await this.seed();
      console.log('演示数据生成完成！');
    }
  }

  async seed() {
    await this.db.clearAll();

    const users = await this.createUsers();
    const filmRolls = await this.createFilmRolls();
    await this.createWorkOrders(users, filmRolls);
  }

  private async createUsers(): Promise<any[]> {
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      {
        id: uuid.v4(),
        username: 'owner',
        password: hashedPassword,
        name: '李明',
        role: 'owner',
        avatar: '👨‍💼',
      },
      {
        id: uuid.v4(),
        username: 'printer1',
        password: hashedPassword,
        name: '张伟',
        role: 'printer',
        avatar: '🧑‍🔬',
      },
      {
        id: uuid.v4(),
        username: 'printer2',
        password: hashedPassword,
        name: '王芳',
        role: 'printer',
        avatar: '👩‍🔬',
      },
      {
        id: uuid.v4(),
        username: 'cs1',
        password: hashedPassword,
        name: '刘洋',
        role: 'customer_service',
        avatar: '👨‍💻',
      },
      {
        id: uuid.v4(),
        username: 'cs2',
        password: hashedPassword,
        name: '陈静',
        role: 'customer_service',
        avatar: '👩‍💻',
      },
    ];

    const saved = [];
    for (const user of users) {
      saved.push(await this.db.create('users', user));
    }
    return saved;
  }

  private async createFilmRolls(): Promise<any[]> {
    const filmRollsData = [
      {
        id: uuid.v4(),
        rollNumber: 'F202405150001',
        customerName: '张三',
        customerPhone: '13800138001',
        filmType: 'color',
        filmBrand: '柯达',
        iso: 400,
        exposures: 36,
        status: 'problem',
        scanResolution: '3000dpi',
        deliveryVersion: 'v1',
        isMixed: true,
        mixedNote: '与F202405150002混装，胶卷外壳颜色相近',
        mixedWithRollNumber: 'F202405150002',
        registeredAt: new Date('2024-05-15T09:30:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405150002',
        customerName: '李四',
        customerPhone: '13800138002',
        filmType: 'color',
        filmBrand: '柯达',
        iso: 400,
        exposures: 36,
        status: 'problem',
        scanResolution: '3000dpi',
        deliveryVersion: 'v1',
        isMixed: true,
        mixedNote: '与F202405150001混装',
        mixedWithRollNumber: 'F202405150001',
        registeredAt: new Date('2024-05-15T09:35:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405160003',
        customerName: '王五',
        customerPhone: '13800138003',
        filmType: 'bw',
        filmBrand: '伊尔福',
        iso: 100,
        exposures: 36,
        status: 'completed',
        scanResolution: '4000dpi',
        deliveryVersion: 'v2',
        isMixed: false,
        registeredAt: new Date('2024-05-16T10:00:00').toISOString(),
        completedAt: new Date('2024-05-18T15:00:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405170004',
        customerName: '赵六',
        customerPhone: '13800138004',
        filmType: 'slide',
        filmBrand: '富士',
        iso: 100,
        exposures: 36,
        status: 'problem',
        scanResolution: '4000dpi',
        deliveryVersion: 'v1',
        isMixed: false,
        internalNotes: '交付版本错误，发了v1，客户订购的是v2（含校色+除尘）',
        registeredAt: new Date('2024-05-17T11:00:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405180005',
        customerName: '孙七',
        customerPhone: '13800138005',
        filmType: 'color',
        filmBrand: '富士',
        iso: 200,
        exposures: 24,
        status: 'scanning',
        scanResolution: '3000dpi',
        isMixed: false,
        registeredAt: new Date('2024-05-18T14:00:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405190006',
        customerName: '周八',
        customerPhone: '13800138006',
        filmType: 'bw',
        filmBrand: '柯达',
        iso: 400,
        exposures: 36,
        status: 'problem',
        scanResolution: '3000dpi',
        deliveryVersion: 'v1',
        isMixed: false,
        internalNotes: '冲洗时出现划痕，约5张照片有明显划痕',
        registeredAt: new Date('2024-05-19T09:00:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405200007',
        customerName: '吴九',
        customerPhone: '13800138007',
        filmType: 'color',
        filmBrand: '柯达',
        iso: 800,
        exposures: 36,
        status: 'developing',
        isMixed: false,
        registeredAt: new Date('2024-05-20T16:00:00').toISOString(),
      },
      {
        id: uuid.v4(),
        rollNumber: 'F202405210008',
        customerName: '郑十',
        customerPhone: '13800138008',
        filmType: 'color',
        filmBrand: '富士',
        iso: 400,
        exposures: 36,
        status: 'completed',
        scanResolution: '3000dpi',
        deliveryVersion: 'v1',
        isMixed: false,
        registeredAt: new Date('2024-05-21T10:30:00').toISOString(),
        completedAt: new Date('2024-05-23T14:00:00').toISOString(),
      },
    ];

    const saved = [];
    for (const fr of filmRollsData) {
      saved.push(await this.db.create('filmRolls', fr));
    }
    return saved;
  }

  private async createWorkOrders(users: any[], filmRolls: any[]) {
    const owner = users.find((u) => u.role === 'owner');
    const printers = users.filter((u) => u.role === 'printer');
    const cs = users.filter((u) => u.role === 'customer_service');

    const workOrdersData = [
      {
        orderNumber: 'WO202405200001',
        category: 'compensation',
        problemType: 'mixed_roll',
        title: '胶卷混号 - 张三与李四的胶卷混装',
        description:
          '2024年5月15日收到的两卷柯达金200胶卷在冲洗时发现混装。两卷胶卷外壳颜色相近，冲扫队在登记时未能准确区分。冲洗后发现底片顺序混乱，客户照片混在一起无法准确分拣。',
        requestedAmount: 120,
        originalPrice: 60,
        hasEvidence: true,
        filmRollId: filmRolls[0].id,
        assigneeId: cs[0].id,
        status: 'reviewing',
        negotiationSummary: '客户要求全额退款并赔付精神损失费，两卷合计120元。客服已与客户协商，客户同意先退款本金，等待店主复核赔付方案。',
        createdAt: new Date('2024-05-20T10:00:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '客服登记问题工单', operator: cs[0], time: new Date('2024-05-20T10:00:00').toISOString() },
          { from: 'pending', to: 'negotiating', remark: '客服与客户电话沟通中，客户情绪激动', operator: cs[0], time: new Date('2024-05-20T10:30:00').toISOString() },
          { from: 'negotiating', to: 'reviewing', remark: '客户同意先退本金60元，额外赔付60元待店主审批', operator: cs[0], time: new Date('2024-05-20T14:20:00').toISOString() },
        ],
        notes: [
          { content: '客户为老客户，累计消费超过2000元，建议妥善处理', type: 'internal', isPrivate: true, creator: cs[0], time: new Date('2024-05-20T10:05:00').toISOString() },
          { content: '客户微信反馈："你们怎么搞的？我上周出去玩拍的照片全乱了！"', type: 'customer', isPrivate: false, creator: cs[0], time: new Date('2024-05-20T10:10:00').toISOString() },
          { content: '已核对冲扫队列表，当天是张伟负责登记，他承认当时忙中出错，两卷胶卷放一起了', type: 'internal', isPrivate: true, creator: cs[1], time: new Date('2024-05-20T11:00:00').toISOString() },
          { content: '客户最终同意：退款60元 + 赔付60元，共计120元。下次来取胶卷时现金赔付。', type: 'negotiation', isPrivate: false, creator: cs[0], time: new Date('2024-05-20T14:25:00').toISOString() },
        ],
        compensation: {
          type: 'partial_refund',
          amount: 60,
          customerCost: 60,
          labCost: 60,
          reason: '胶卷混号，导致客户照片无法区分',
          status: 'pending',
        },
      },
      {
        orderNumber: 'WO202405200002',
        category: 'compensation',
        problemType: 'wrong_version',
        title: '交付版本错发 - 赵六的反转片',
        description: '客户赵六订购的是富士Provia 100F反转片v2版本（含专业校色+除尘），但实际交付的是v1版本（仅基础扫描）。客户发现后投诉，要求重新处理并赔付。',
        requestedAmount: 180,
        originalPrice: 120,
        hasEvidence: true,
        filmRollId: filmRolls[3].id,
        assigneeId: cs[1].id,
        status: 'negotiating',
        createdAt: new Date('2024-05-20T11:30:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '客户到店投诉，客服登记', operator: cs[1], time: new Date('2024-05-20T11:30:00').toISOString() },
          { from: 'pending', to: 'negotiating', remark: '正在与客户协商解决方案', operator: cs[1], time: new Date('2024-05-20T12:00:00').toISOString() },
        ],
        notes: [
          { content: '客户订单系统显示确实是v2版本，仓库发错了v1', type: 'internal', isPrivate: true, creator: cs[1], time: new Date('2024-05-20T11:45:00').toISOString() },
          { content: '王芳负责扫描，她说是按系统标注的v1处理的，可能是订单录入错误', type: 'internal', isPrivate: true, creator: cs[1], time: new Date('2024-05-20T13:00:00').toISOString() },
        ],
      },
      {
        orderNumber: 'WO202405210003',
        category: 'compensation',
        problemType: 'quality_issue',
        title: '冲洗划痕 - 周八的黑白胶卷',
        description: '客户周八的柯达TMAX 400黑白胶卷冲洗后发现有5张照片存在明显的机械划痕。客户要求重新冲洗或赔付。',
        requestedAmount: 80,
        originalPrice: 80,
        hasEvidence: true,
        filmRollId: filmRolls[5].id,
        assigneeId: printers[0].id,
        status: 'pending',
        createdAt: new Date('2024-05-21T09:00:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '冲扫队自检发现问题，上报', operator: printers[0], time: new Date('2024-05-21T09:00:00').toISOString() },
        ],
        notes: [
          { content: '冲扫机滚筒可能有异物，已安排清洗', type: 'internal', isPrivate: true, creator: printers[0], time: new Date('2024-05-21T09:15:00').toISOString() },
        ],
      },
      {
        orderNumber: 'WO202405190004',
        category: 'refund',
        problemType: 'other',
        title: '客户取消订单 - 吴九',
        description: '客户吴九因个人原因要求取消尚未开始处理的胶卷订单。',
        requestedAmount: 50,
        originalPrice: 50,
        hasEvidence: false,
        assigneeId: cs[0].id,
        status: 'completed',
        reviewConclusion: '客户确因个人原因取消，胶卷未开封，同意全额退款',
        closedAt: new Date('2024-05-19T16:00:00').toISOString(),
        createdAt: new Date('2024-05-19T14:00:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '客户来电取消订单', operator: cs[0], time: new Date('2024-05-19T14:00:00').toISOString() },
          { from: 'pending', to: 'negotiating', remark: '与客户确认退款方式', operator: cs[0], time: new Date('2024-05-19T14:10:00').toISOString() },
          { from: 'negotiating', to: 'reviewing', remark: '提交店主复核', operator: cs[0], time: new Date('2024-05-19T14:30:00').toISOString() },
          { from: 'reviewing', to: 'approved', remark: '店主同意退款', operator: owner, time: new Date('2024-05-19T15:00:00').toISOString() },
          { from: 'approved', to: 'completed', remark: '退款已处理，原路返回', operator: cs[0], time: new Date('2024-05-19T16:00:00').toISOString() },
        ],
        notes: [
          { content: '客户说胶卷是去年买的，一直没拍，现在不想玩了', type: 'customer', isPrivate: false, creator: cs[0], time: new Date('2024-05-19T14:05:00').toISOString() },
          { content: '店主批复：可以退，但要提醒客户下次想清楚再下单', type: 'review', isPrivate: false, creator: owner, time: new Date('2024-05-19T15:05:00').toISOString() },
        ],
        compensation: {
          type: 'full_refund',
          amount: 50,
          customerCost: 0,
          labCost: 0,
          reason: '客户个人原因取消订单，胶卷未开封',
          status: 'completed',
          ownerReview: '同意退款',
          approvedAt: new Date('2024-05-19T15:00:00').toISOString(),
          paidAt: new Date('2024-05-19T16:00:00').toISOString(),
          approvedBy: '李明',
        },
      },
      {
        orderNumber: 'WO202405220005',
        category: 'rework',
        problemType: 'quality_issue',
        title: '颜色偏色返工 - 王五的黑白胶卷',
        description: '客户王五反馈黑白胶卷扫描后颜色偏黄，要求重新校色处理。',
        requestedAmount: 0,
        originalPrice: 70,
        hasEvidence: true,
        filmRollId: filmRolls[2].id,
        assigneeId: printers[1].id,
        status: 'completed',
        closedAt: new Date('2024-05-23T17:00:00').toISOString(),
        createdAt: new Date('2024-05-22T10:00:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '客户反馈颜色问题', operator: cs[1], time: new Date('2024-05-22T10:00:00').toISOString() },
          { from: 'pending', to: 'negotiating', remark: '确认是校色参数问题，安排免费返工', operator: printers[1], time: new Date('2024-05-22T11:00:00').toISOString() },
          { from: 'negotiating', to: 'completed', remark: '返工完成，客户满意', operator: printers[1], time: new Date('2024-05-23T17:00:00').toISOString() },
        ],
        notes: [
          { content: '扫描时灰卡校准有误，已修正参数', type: 'internal', isPrivate: true, creator: printers[1], time: new Date('2024-05-22T11:30:00').toISOString() },
          { content: '客户表示理解，对处理速度满意', type: 'customer', isPrivate: false, creator: cs[1], time: new Date('2024-05-23T17:30:00').toISOString() },
        ],
      },
      {
        orderNumber: 'WO202405240006',
        category: 'complaint',
        problemType: 'delay',
        title: '交付延迟投诉 - 郑十',
        description: '客户郑十的胶卷承诺3天交付，但实际用了5天。客户不满，要求解释。',
        requestedAmount: 0,
        originalPrice: 60,
        hasEvidence: false,
        filmRollId: filmRolls[7].id,
        assigneeId: cs[0].id,
        status: 'pending',
        createdAt: new Date('2024-05-24T09:00:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '客户微信投诉', operator: cs[0], time: new Date('2024-05-24T09:00:00').toISOString() },
        ],
        notes: [
          { content: '延迟原因：5月22日冲扫机故障，维修了一天', type: 'internal', isPrivate: true, creator: cs[0], time: new Date('2024-05-24T09:10:00').toISOString() },
        ],
      },
      {
        orderNumber: 'WO202405200007',
        category: 'compensation',
        problemType: 'mixed_roll',
        title: '胶卷混号（关联）- 李四',
        description: '同WO202405200001，李四的胶卷也被混装。',
        requestedAmount: 120,
        originalPrice: 60,
        hasEvidence: true,
        filmRollId: filmRolls[1].id,
        assigneeId: cs[0].id,
        status: 'reviewing',
        negotiationSummary: '与张三的情况相同，客户同意同样的赔付方案。',
        createdAt: new Date('2024-05-20T10:05:00').toISOString(),
        logs: [
          { from: 'none', to: 'pending', remark: '关联工单，与WO202405200001同一事件', operator: cs[0], time: new Date('2024-05-20T10:05:00').toISOString() },
          { from: 'pending', to: 'negotiating', remark: '客户沟通中', operator: cs[0], time: new Date('2024-05-20T10:35:00').toISOString() },
          { from: 'negotiating', to: 'reviewing', remark: '客户同意方案，待审批', operator: cs[0], time: new Date('2024-05-20T14:30:00').toISOString() },
        ],
        notes: [
          { content: '客户是摄影师，这卷是给客人拍的，影响比较大', type: 'internal', isPrivate: true, creator: cs[0], time: new Date('2024-05-20T10:10:00').toISOString() },
        ],
        compensation: {
          type: 'partial_refund',
          amount: 60,
          customerCost: 60,
          labCost: 60,
          reason: '胶卷混号，与WO202405200001同一事件',
          status: 'pending',
        },
      },
    ];

    for (const woData of workOrdersData) {
      const { logs, notes, compensation, ...orderData } = woData as any;

      const workOrder = await this.db.create('workOrders', {
        id: uuid.v4(),
        ...orderData,
      });

      if (logs) {
        for (const log of logs) {
          await this.db.create('statusLogs', {
            id: uuid.v4(),
            workOrderId: workOrder.id,
            fromStatus: log.from,
            toStatus: log.to,
            remark: log.remark,
            operatorId: log.operator?.id,
            operatorName: log.operator?.name,
            operatorRole: log.operator?.role,
            createdAt: log.time,
          });
        }
      }

      if (notes) {
        for (const note of notes) {
          await this.db.create('notes', {
            id: uuid.v4(),
            workOrderId: workOrder.id,
            content: note.content,
            type: note.type,
            isPrivate: note.isPrivate,
            creatorId: note.creator?.id,
            creatorName: note.creator?.name,
            creatorRole: note.creator?.role,
            createdAt: note.time,
          });
        }
      }

      if (compensation) {
        await this.db.create('compensations', {
          id: uuid.v4(),
          workOrderId: workOrder.id,
          ...compensation,
        });
      }
    }
  }
}
