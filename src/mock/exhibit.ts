import type { ExhibitBorrow } from '@/types'

export const mockBorrowOrders: ExhibitBorrow[] = [
  {
    id: '1',
    orderNo: 'JD20240501001',
    exhibitName: '宋代山水画卷专题展',
    source: '故宫博物院',
    destination: '本馆A展厅',
    applicant: '张馆长',
    applyTime: '2024-05-01 09:30:00',
    expectCompleteTime: '2024-05-20 18:00:00',
    status: 'exception',
    priority: 'high',
    hasException: true,
    items: [
      { id: '1-1', name: '溪山行旅图', code: 'EX-001', category: '绘画', status: 'borrowed', location: '运输中' },
      { id: '1-2', name: '早春图', code: 'EX-002', category: '绘画', status: 'borrowed', location: '运输中' },
      { id: '1-3', name: '万壑松风图', code: 'EX-003', category: '绘画', status: 'borrowed', location: '运输中' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '张馆长', operateTime: '2024-05-01 09:30:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '李主任', operateTime: '2024-05-02 14:20:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '王保管员', operateTime: '2024-05-05 10:00:00' },
      { id: 'p4', name: '运输中', status: 'processing', operator: '赵师傅' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  },
  {
    id: '2',
    orderNo: 'JD20240503002',
    exhibitName: '明清瓷器精品展',
    source: '上海博物馆',
    destination: '本馆B展厅',
    applicant: '王策展',
    applyTime: '2024-05-03 14:00:00',
    expectCompleteTime: '2024-05-25 18:00:00',
    status: 'installing',
    priority: 'high',
    hasException: false,
    items: [
      { id: '2-1', name: '青花瓷瓶', code: 'EX-004', category: '瓷器', status: 'installing', location: 'B展厅' },
      { id: '2-2', name: '斗彩鸡缸杯', code: 'EX-005', category: '瓷器', status: 'installing', location: 'B展厅' },
      { id: '2-3', name: '粉彩大盘', code: 'EX-006', category: '瓷器', status: 'installing', location: 'B展厅' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '王策展', operateTime: '2024-05-03 14:00:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '陈主任', operateTime: '2024-05-04 10:30:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '刘保管员', operateTime: '2024-05-08 09:00:00' },
      { id: 'p4', name: '运输中', status: 'completed', operator: '孙师傅', operateTime: '2024-05-10 16:00:00' },
      { id: 'p5', name: '本馆签收', status: 'completed', operator: '周保管员', operateTime: '2024-05-10 16:30:00' },
      { id: 'p6', name: '布展完成', status: 'processing', operator: '郑布展' }
    ]
  },
  {
    id: '3',
    orderNo: 'JD20240415003',
    exhibitName: '近现代书法特展',
    source: '中国美术馆',
    destination: '本馆C展厅',
    applicant: '李策展',
    applyTime: '2024-04-15 10:00:00',
    expectCompleteTime: '2024-05-15 18:00:00',
    actualCompleteTime: '2024-05-14 15:30:00',
    status: 'completed',
    priority: 'medium',
    hasException: false,
    items: [
      { id: '3-1', name: '兰亭序摹本', code: 'EX-007', category: '书法', status: 'returned', location: '中国美术馆' },
      { id: '3-2', name: '多宝塔碑', code: 'EX-008', category: '书法', status: 'returned', location: '中国美术馆' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '李策展', operateTime: '2024-04-15 10:00:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '王主任', operateTime: '2024-04-16 11:00:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '张保管员', operateTime: '2024-04-20 08:30:00' },
      { id: 'p4', name: '运输中', status: 'completed', operator: '李师傅', operateTime: '2024-04-22 14:00:00' },
      { id: 'p5', name: '本馆签收', status: 'completed', operator: '王保管员', operateTime: '2024-04-22 14:30:00' },
      { id: 'p6', name: '布展完成', status: 'completed', operator: '陈布展', operateTime: '2024-05-14 15:30:00' }
    ]
  },
  {
    id: '4',
    orderNo: 'JD20240510004',
    exhibitName: '青铜器珍品展',
    source: '陕西历史博物馆',
    destination: '本馆D展厅',
    applicant: '赵馆长',
    applyTime: '2024-05-10 16:00:00',
    expectCompleteTime: '2024-06-05 18:00:00',
    status: 'transferring',
    priority: 'high',
    hasException: false,
    items: [
      { id: '4-1', name: '司母戊鼎', code: 'EX-009', category: '青铜器', status: 'borrowed', location: '运输中' },
      { id: '4-2', name: '四羊方尊', code: 'EX-010', category: '青铜器', status: 'borrowed', location: '运输中' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '赵馆长', operateTime: '2024-05-10 16:00:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '钱主任', operateTime: '2024-05-12 09:00:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '孙保管员', operateTime: '2024-05-15 07:00:00' },
      { id: 'p4', name: '运输中', status: 'processing', operator: '周师傅' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  },
  {
    id: '5',
    orderNo: 'JD20240518005',
    exhibitName: '玉器文化展',
    source: '南京博物院',
    destination: '本馆E展厅',
    applicant: '孙策展',
    applyTime: '2024-05-18 11:00:00',
    expectCompleteTime: '2024-06-10 18:00:00',
    status: 'pending',
    priority: 'medium',
    hasException: false,
    items: [
      { id: '5-1', name: '翠玉白菜', code: 'EX-011', category: '玉器', status: 'in_stock', location: '南京博物院' },
      { id: '5-2', name: '肉形石', code: 'EX-012', category: '玉器', status: 'in_stock', location: '南京博物院' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'processing', operator: '孙策展' },
      { id: 'p2', name: '对方馆确认', status: 'pending' },
      { id: 'p3', name: '展品出库', status: 'pending' },
      { id: 'p4', name: '运输中', status: 'pending' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  },
  {
    id: '6',
    orderNo: 'JD20240520006',
    exhibitName: '敦煌壁画复原展',
    source: '敦煌研究院',
    destination: '本馆F展厅',
    applicant: '吴策展',
    applyTime: '2024-05-20 09:00:00',
    expectCompleteTime: '2024-06-15 18:00:00',
    status: 'pending',
    priority: 'low',
    hasException: false,
    items: [
      { id: '6-1', name: '飞天壁画', code: 'EX-013', category: '壁画', status: 'in_stock', location: '敦煌研究院' },
      { id: '6-2', name: '九色鹿壁画', code: 'EX-014', category: '壁画', status: 'in_stock', location: '敦煌研究院' },
      { id: '6-3', name: '反弹琵琶壁画', code: 'EX-015', category: '壁画', status: 'in_stock', location: '敦煌研究院' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'pending' },
      { id: 'p2', name: '对方馆确认', status: 'pending' },
      { id: 'p3', name: '展品出库', status: 'pending' },
      { id: 'p4', name: '运输中', status: 'pending' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  },
  {
    id: '7',
    orderNo: 'JD20240508007',
    exhibitName: '甲骨文特展',
    source: '中国国家博物馆',
    destination: '本馆G展厅',
    applicant: '郑策展',
    applyTime: '2024-05-08 15:00:00',
    expectCompleteTime: '2024-05-28 18:00:00',
    status: 'exception',
    priority: 'urgent',
    hasException: true,
    items: [
      { id: '7-1', name: '甲骨片一组', code: 'EX-016', category: '甲骨', status: 'borrowed', location: '位置待确认' },
      { id: '7-2', name: '卜骨刻辞', code: 'EX-017', category: '甲骨', status: 'borrowed', location: '位置待确认' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '郑策展', operateTime: '2024-05-08 15:00:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '冯主任', operateTime: '2024-05-09 10:00:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '陈保管员', operateTime: '2024-05-12 08:00:00' },
      { id: 'p4', name: '运输中', status: 'completed', operator: '褚师傅', operateTime: '2024-05-14 12:00:00', remark: '运输完成但位置异常' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  },
  {
    id: '8',
    orderNo: 'JD20240515008',
    exhibitName: '丝绸文化展',
    source: '苏州博物馆',
    destination: '本馆H展厅',
    applicant: '王策展',
    applyTime: '2024-05-15 13:00:00',
    expectCompleteTime: '2024-06-01 18:00:00',
    status: 'transferring',
    priority: 'medium',
    hasException: false,
    items: [
      { id: '8-1', name: '龙袍', code: 'EX-018', category: '丝绸', status: 'borrowed', location: '运输中' },
      { id: '8-2', name: '云锦', code: 'EX-019', category: '丝绸', status: 'borrowed', location: '运输中' }
    ],
    progress: [
      { id: 'p1', name: '借调申请', status: 'completed', operator: '王策展', operateTime: '2024-05-15 13:00:00' },
      { id: 'p2', name: '对方馆确认', status: 'completed', operator: '卫主任', operateTime: '2024-05-16 14:00:00' },
      { id: 'p3', name: '展品出库', status: 'completed', operator: '蒋保管员', operateTime: '2024-05-20 09:00:00' },
      { id: 'p4', name: '运输中', status: 'processing', operator: '沈师傅' },
      { id: 'p5', name: '本馆签收', status: 'pending' },
      { id: 'p6', name: '布展完成', status: 'pending' }
    ]
  }
]
