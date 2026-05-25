import type { ExceptionRecord } from '@/types'

export const mockExceptions: ExceptionRecord[] = [
  {
    id: '1',
    exceptionNo: 'EXC20240520001',
    type: 'overdue',
    title: '宋代山水画卷专题展 - 展品逾期未归还',
    description: '借调单JD20240501001预计完成时间为2024-05-20，目前已逾期2天。展品仍在运输途中，未按时到达本馆。可能影响专题展的正常开幕。',
    relatedOrderId: '1',
    relatedOrderType: 'borrow',
    relatedOrderNo: 'JD20240501001',
    status: 'processing',
    priority: 'urgent',
    reporter: '系统自动检测',
    reportTime: '2024-05-21 08:00:00',
    handler: '活动执行-小王',
    handleTime: '2024-05-21 08:30:00',
    handleRecords: [
      {
        id: 'hr1',
        operator: '活动执行-小王',
        operateTime: '2024-05-21 08:30:00',
        action: '领取异常',
        remark: '已收到异常通知，立即联系运输方确认位置'
      },
      {
        id: 'hr2',
        operator: '活动执行-小王',
        operateTime: '2024-05-21 09:15:00',
        action: '联系运输方',
        remark: '运输方回复：因高速堵车，预计今晚20:00到达。已协调本馆夜班人员待命签收。'
      },
      {
        id: 'hr3',
        operator: '馆务经理-张总',
        operateTime: '2024-05-21 10:00:00',
        action: '审批处理方案',
        remark: '同意延迟方案，已通知策展团队调整布展时间表。'
      }
    ]
  },
  {
    id: '2',
    exceptionNo: 'EXC20240520002',
    type: 'mismatch',
    title: 'VIP会员专场活动 - 核销数量与台账不符',
    description: '票务订单TK20240520003显示核销45张，但会员系统签到记录显示实际到场57人，存在12人差异。疑似存在无票入场或核销漏登记情况。',
    relatedOrderId: '3',
    relatedOrderType: 'ticket',
    relatedOrderNo: 'TK20240520003',
    status: 'pending',
    priority: 'high',
    reporter: '票务专员-小张',
    reportTime: '2024-05-20 17:30:00',
    handleRecords: []
  },
  {
    id: '3',
    exceptionNo: 'EXC20240520003',
    type: 'low_checkin',
    title: '周末艺术讲座 - 签到率异常低',
    description: '周末艺术讲座活动发放80张票，开场30分钟后仅核销15张，签到率不足20%。远低于历史平均水平（约60%）。',
    relatedOrderId: '5',
    relatedOrderType: 'ticket',
    relatedOrderNo: 'TK20240521002',
    status: 'processing',
    priority: 'medium',
    reporter: '系统自动检测',
    reportTime: '2024-05-21 14:30:00',
    handler: '活动执行-小李',
    handleTime: '2024-05-21 14:35:00',
    handleRecords: [
      {
        id: 'hr1',
        operator: '活动执行-小李',
        operateTime: '2024-05-21 14:35:00',
        action: '领取异常',
        remark: '正在核实原因'
      },
      {
        id: 'hr2',
        operator: '活动执行-小李',
        operateTime: '2024-05-21 14:50:00',
        action: '核实情况',
        remark: '经确认：因同期有其他大型活动，且天气原因（暴雨），导致部分听众无法到场。已通过短信通知后续补听安排。'
      }
    ]
  },
  {
    id: '4',
    exceptionNo: 'EXC20240520004',
    type: 'location_mismatch',
    title: '甲骨文特展 - 展品状态与实际位置不符',
    description: '借调单JD20240508007系统显示运输已完成，但本馆库房和展厅均未收到展品。运输公司GPS显示车辆已离开本馆区域，位置异常。',
    relatedOrderId: '7',
    relatedOrderType: 'borrow',
    relatedOrderNo: 'JD20240508007',
    status: 'pending',
    priority: 'urgent',
    reporter: '保管员-老周',
    reportTime: '2024-05-21 07:30:00',
    handleRecords: []
  },
  {
    id: '5',
    exceptionNo: 'EXC20240520005',
    type: 'schedule_conflict',
    title: '紧急插单导致进度冲突',
    description: '因上级领导临时安排VIP参观，原定今日的布展工作需暂停接待。可能导致明清瓷器精品展布展进度延误。',
    relatedOrderId: '2',
    relatedOrderType: 'borrow',
    relatedOrderNo: 'JD20240503002',
    status: 'resolved',
    priority: 'high',
    reporter: '布展组长-老郑',
    reportTime: '2024-05-20 08:00:00',
    handler: '馆务经理-张总',
    handleTime: '2024-05-20 08:15:00',
    resolveTime: '2024-05-20 16:00:00',
    handleRecords: [
      {
        id: 'hr1',
        operator: '馆务经理-张总',
        operateTime: '2024-05-20 08:15:00',
        action: '领取异常',
        remark: '紧急协调中'
      },
      {
        id: 'hr2',
        operator: '馆务经理-张总',
        operateTime: '2024-05-20 09:00:00',
        action: '协调处理',
        remark: '已与办公室协调：VIP参观时间调整为10:00-11:30，布展工作上午暂停，下午13:30恢复。'
      },
      {
        id: 'hr3',
        operator: '布展组长-老郑',
        operateTime: '2024-05-20 16:00:00',
        action: '确认完成',
        remark: '下午已加班加点完成布展工作，进度无延误。'
      }
    ]
  }
]
