import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type {
  User,
  Show,
  GroupOrder,
  RefundRequest,
  OperationLog,
  UserRole,
} from '../types';

class Database {
  users: User[] = [];
  shows: Show[] = [];
  groupOrders: GroupOrder[] = [];
  refundRequests: RefundRequest[] = [];
  operationLogs: OperationLog[] = [];

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async initialize() {
    const hashedPassword = await this.hashPassword('123456');

    this.users = [
      {
        id: uuidv4(),
        username: 'manager',
        password: hashedPassword,
        name: '王经理',
        role: 'THEATER_MANAGER',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: uuidv4(),
        username: 'ticket',
        password: hashedPassword,
        name: '李票务',
        role: 'TICKET_SUPERVISOR',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: uuidv4(),
        username: 'backend',
        password: hashedPassword,
        name: '张后台',
        role: 'BACKEND_COORDINATOR',
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ];

    const managerId = this.users[0].id;
    const ticketId = this.users[1].id;
    const backendId = this.users[2].id;

    this.shows = [
      {
        id: uuidv4(),
        name: '《雷雨》经典话剧',
        type: 'DRAMA',
        startTime: new Date('2024-06-15T19:30:00').toISOString(),
        endTime: new Date('2024-06-15T22:00:00').toISOString(),
        venue: '大剧院主厅',
        totalSeats: 800,
        status: 'CONFIRMED',
        rehearsalSchedule: [
          {
            id: uuidv4(),
            date: '2024-06-12',
            startTime: '14:00',
            endTime: '17:00',
            type: 'TECH',
            confirmedBy: backendId,
            confirmedAt: new Date('2024-06-10').toISOString(),
          },
          {
            id: uuidv4(),
            date: '2024-06-14',
            startTime: '19:00',
            endTime: '22:00',
            type: 'DRESS',
          },
        ],
        createdBy: managerId,
        createdAt: new Date('2024-05-01').toISOString(),
        updatedAt: new Date('2024-06-10').toISOString(),
        version: 1,
        changeLog: [],
      },
      {
        id: uuidv4(),
        name: '《天鹅湖》芭蕾舞剧',
        type: 'DANCE',
        startTime: new Date('2024-06-20T19:00:00').toISOString(),
        endTime: new Date('2024-06-20T21:30:00').toISOString(),
        venue: '大剧院主厅',
        totalSeats: 800,
        status: 'MODIFIED',
        rehearsalSchedule: [
          {
            id: uuidv4(),
            date: '2024-06-17',
            startTime: '10:00',
            endTime: '12:00',
            type: 'WALKTHROUGH',
            confirmedBy: backendId,
            confirmedAt: new Date('2024-06-15').toISOString(),
          },
        ],
        createdBy: managerId,
        createdAt: new Date('2024-05-10').toISOString(),
        updatedAt: new Date('2024-06-12').toISOString(),
        version: 2,
        changeLog: [
          {
            id: uuidv4(),
            changedBy: managerId,
            changedAt: new Date('2024-06-12').toISOString(),
            field: 'startTime',
            oldValue: '2024-06-18T19:00:00.000Z',
            newValue: '2024-06-20T19:00:00.000Z',
            reason: '主演档期调整',
          },
        ],
      },
      {
        id: uuidv4(),
        name: '《茉莉花》民族音乐会',
        type: 'CONCERT',
        startTime: new Date('2024-06-25T19:30:00').toISOString(),
        endTime: new Date('2024-06-25T21:30:00').toISOString(),
        venue: '音乐厅',
        totalSeats: 500,
        status: 'CONFIRMED',
        rehearsalSchedule: [],
        createdBy: managerId,
        createdAt: new Date('2024-05-15').toISOString(),
        updatedAt: new Date('2024-06-01').toISOString(),
        version: 1,
        changeLog: [],
      },
      {
        id: uuidv4(),
        name: '《白雪公主》儿童剧',
        type: 'CHILDREN',
        startTime: new Date('2024-07-01T14:30:00').toISOString(),
        endTime: new Date('2024-07-01T16:30:00').toISOString(),
        venue: '小剧场',
        totalSeats: 300,
        status: 'DRAFT',
        rehearsalSchedule: [],
        createdBy: managerId,
        createdAt: new Date('2024-06-01').toISOString(),
        updatedAt: new Date('2024-06-01').toISOString(),
        version: 1,
        changeLog: [],
      },
    ];

    const show1Id = this.shows[0].id;
    const show2Id = this.shows[1].id;
    const show3Id = this.shows[2].id;

    this.groupOrders = [
      {
        id: uuidv4(),
        orderNo: 'GD202406001',
        showId: show1Id,
        organization: '市第一中学',
        contactName: '刘老师',
        contactPhone: '13800138001',
        ticketCount: 50,
        unitPrice: 80,
        totalAmount: 4000,
        status: 'PAID',
        specialRequirements: '需要预留前排位置，方便学生观看',
        createdBy: ticketId,
        createdAt: new Date('2024-06-05').toISOString(),
        updatedAt: new Date('2024-06-08').toISOString(),
        confirmedBy: ticketId,
        confirmedAt: new Date('2024-06-06').toISOString(),
        version: 1,
        changeLog: [
          {
            id: uuidv4(),
            changedBy: ticketId,
            changedAt: new Date('2024-06-06').toISOString(),
            action: '确认',
            description: '票务主管确认订单',
          },
          {
            id: uuidv4(),
            changedBy: ticketId,
            changedAt: new Date('2024-06-08').toISOString(),
            action: '收款',
            description: '收到全额款项4000元，转账支付',
          },
        ],
        settlement: {
          id: uuidv4(),
          orderId: '',
          totalAmount: 4000,
          paidAmount: 4000,
          refundAmount: 0,
          netAmount: 4000,
          status: 'SETTLED',
          paymentRecords: [
            {
              id: uuidv4(),
              amount: 4000,
              paymentMethod: '银行转账',
              paidAt: new Date('2024-06-08').toISOString(),
              recordedBy: ticketId,
              remark: '市一中团购票款',
            },
          ],
          createdAt: new Date('2024-06-05').toISOString(),
          updatedAt: new Date('2024-06-08').toISOString(),
        },
      },
      {
        id: uuidv4(),
        orderNo: 'GD202406002',
        showId: show1Id,
        organization: '星光社区居委会',
        contactName: '陈主任',
        contactPhone: '13800138002',
        ticketCount: 30,
        unitPrice: 80,
        totalAmount: 2400,
        status: 'CONFIRMED',
        createdBy: ticketId,
        createdAt: new Date('2024-06-08').toISOString(),
        updatedAt: new Date('2024-06-09').toISOString(),
        confirmedBy: ticketId,
        confirmedAt: new Date('2024-06-09').toISOString(),
        version: 1,
        changeLog: [
          {
            id: uuidv4(),
            changedBy: ticketId,
            changedAt: new Date('2024-06-09').toISOString(),
            action: '确认',
            description: '票务主管确认订单，待付款',
          },
        ],
        settlement: {
          id: uuidv4(),
          orderId: '',
          totalAmount: 2400,
          paidAmount: 0,
          refundAmount: 0,
          netAmount: 2400,
          status: 'UNPAID',
          paymentRecords: [],
          createdAt: new Date('2024-06-08').toISOString(),
          updatedAt: new Date('2024-06-08').toISOString(),
        },
      },
      {
        id: uuidv4(),
        orderNo: 'GD202406003',
        showId: show2Id,
        organization: '市老年大学',
        contactName: '赵校长',
        contactPhone: '13800138003',
        ticketCount: 100,
        unitPrice: 120,
        totalAmount: 12000,
        status: 'MODIFIED',
        specialRequirements: '原订6月18日场次，因演出改期需要确认是否保留',
        createdBy: ticketId,
        createdAt: new Date('2024-06-01').toISOString(),
        updatedAt: new Date('2024-06-12').toISOString(),
        confirmedBy: ticketId,
        confirmedAt: new Date('2024-06-02').toISOString(),
        version: 2,
        changeLog: [
          {
            id: uuidv4(),
            changedBy: ticketId,
            changedAt: new Date('2024-06-02').toISOString(),
            action: '确认',
            description: '票务主管确认订单',
          },
          {
            id: uuidv4(),
            changedBy: ticketId,
            changedAt: new Date('2024-06-12').toISOString(),
            action: '场次变更通知',
            description: '演出时间从6月18日改为6月20日，已通知客户待确认',
          },
        ],
        settlement: {
          id: uuidv4(),
          orderId: '',
          totalAmount: 12000,
          paidAmount: 6000,
          refundAmount: 0,
          netAmount: 6000,
          status: 'PARTIAL',
          paymentRecords: [
            {
              id: uuidv4(),
              amount: 6000,
              paymentMethod: '现金',
              paidAt: new Date('2024-06-03').toISOString(),
              recordedBy: ticketId,
              remark: '定金50%',
            },
          ],
          createdAt: new Date('2024-06-01').toISOString(),
          updatedAt: new Date('2024-06-03').toISOString(),
        },
      },
      {
        id: uuidv4(),
        orderNo: 'GD202406004',
        showId: show3Id,
        organization: '和谐企业工会',
        contactName: '孙主席',
        contactPhone: '13800138004',
        ticketCount: 80,
        unitPrice: 150,
        totalAmount: 12000,
        status: 'PENDING',
        specialRequirements: '企业员工福利，需要开发票',
        createdBy: ticketId,
        createdAt: new Date('2024-06-14').toISOString(),
        updatedAt: new Date('2024-06-14').toISOString(),
        version: 1,
        changeLog: [],
        settlement: {
          id: uuidv4(),
          orderId: '',
          totalAmount: 12000,
          paidAmount: 0,
          refundAmount: 0,
          netAmount: 12000,
          status: 'UNPAID',
          paymentRecords: [],
          createdAt: new Date('2024-06-14').toISOString(),
          updatedAt: new Date('2024-06-14').toISOString(),
        },
      },
    ];

    this.groupOrders.forEach((order) => {
      if (order.settlement) {
        order.settlement.orderId = order.id;
      }
    });

    const order2Id = this.groupOrders[1].id;
    const order3Id = this.groupOrders[2].id;

    this.refundRequests = [
      {
        id: uuidv4(),
        requestNo: 'TK202406001',
        orderId: order2Id,
        showId: show1Id,
        type: 'PARTIAL',
        reason: '社区活动时间冲突，部分老人无法参加',
        originalTicketCount: 30,
        refundTicketCount: 10,
        refundAmount: 800,
        status: 'PENDING',
        applicantName: '陈主任',
        applicantPhone: '13800138002',
        createdAt: new Date('2024-06-13').toISOString(),
      },
      {
        id: uuidv4(),
        requestNo: 'TK202406002',
        orderId: order3Id,
        showId: show2Id,
        type: 'DATE_CHANGE',
        reason: '演出改期后时间不合适，希望改到其他场次',
        originalTicketCount: 100,
        refundTicketCount: 100,
        refundAmount: 6000,
        newShowId: show3Id,
        status: 'APPROVED_TICKET',
        applicantName: '赵校长',
        applicantPhone: '13800138003',
        createdAt: new Date('2024-06-12').toISOString(),
        ticketApprovedBy: ticketId,
        ticketApprovedAt: new Date('2024-06-13').toISOString(),
        ticketApprovalNote: '情况属实，建议改到6月25日音乐会场次，已与客户沟通确认',
      },
    ];

    this.operationLogs = [
      {
        id: uuidv4(),
        userId: managerId,
        userName: '王经理',
        action: '创建场次',
        targetType: 'Show',
        targetId: show1Id,
        detail: '创建了《雷雨》经典话剧场次',
        createdAt: new Date('2024-05-01').toISOString(),
      },
      {
        id: uuidv4(),
        userId: ticketId,
        userName: '李票务',
        action: '创建团单',
        targetType: 'GroupOrder',
        targetId: this.groupOrders[0].id,
        detail: '创建了市第一中学团单，50张票',
        createdAt: new Date('2024-06-05').toISOString(),
      },
    ];

    console.log('Database initialized with sample data');
    console.log('Users:');
    this.users.forEach((u) => {
      console.log(`  ${u.username} (${u.role}): 123456`);
    });
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async findUserById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  addOperationLog(
    userId: string,
    userName: string,
    action: string,
    targetType: string,
    targetId: string,
    detail: string
  ) {
    this.operationLogs.unshift({
      id: uuidv4(),
      userId,
      userName,
      action,
      targetType,
      targetId,
      detail,
      createdAt: new Date().toISOString(),
    });
  }
}

export const db = new Database();
