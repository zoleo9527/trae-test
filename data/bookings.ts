import type { Booking } from '~/types'

export const mockBookings: Booking[] = [
  {
    id: 'booking-001',
    bookingNo: 'BK-2024-0520-001',
    customerId: 'cust-001',
    customerName: '陈总',
    customerPhone: '13900139001',
    type: 'driving_range',
    bayNumber: 'A-08',
    date: '2024-05-20',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    status: 'completed',
    numberOfPeople: 3,
    equipmentRentals: [
      {
        id: 'rental-001',
        equipmentId: 'equipment-001',
        equipmentName: '职业套杆组',
        quantity: 1,
        rentalFee: 200,
        pickedUp: true,
        pickedUpAt: '2024-05-20T13:50:00+08:00',
        returned: true,
        returnedAt: '2024-05-20T16:15:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      },
      {
        id: 'rental-002',
        equipmentId: 'equipment-004',
        equipmentName: '测距仪',
        quantity: 1,
        rentalFee: 50,
        pickedUp: true,
        pickedUpAt: '2024-05-20T13:50:00+08:00',
        returned: true,
        returnedAt: '2024-05-20T16:15:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      }
    ],
    fees: [
      {
        id: 'fee-001',
        name: '打位费（2小时）',
        category: 'green_fee',
        amount: 400,
        prepaidApplicable: true,
        description: 'A区VIP打位'
      },
      {
        id: 'fee-002',
        name: '练习球（3盒）',
        category: 'range_ball',
        amount: 150,
        prepaidApplicable: true,
        description: '三层练习球'
      },
      {
        id: 'fee-003',
        name: '球杆租赁费',
        category: 'rental',
        amount: 200,
        prepaidApplicable: true,
        description: '职业套杆组'
      },
      {
        id: 'fee-004',
        name: '测距仪租赁费',
        category: 'rental',
        amount: 50,
        prepaidApplicable: true,
        description: '高尔夫测距仪'
      }
    ],
    totalAmount: 800,
    prepaidDeducted: 680,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-20T13:55:00+08:00',
    checkOutTime: '2024-05-20T16:20:00+08:00',
    noShow: false,
    remark: '客户是铂金会员，享受85折优惠。本次消费储值卡扣款680元（原价800元）。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-20T14:00:00+08:00',
    updatedAt: '2024-05-20T16:30:00+08:00'
  },
  {
    id: 'booking-002',
    bookingNo: 'BK-2024-0522-001',
    customerId: 'cust-002',
    customerName: '刘先生',
    customerPhone: '13900139002',
    type: 'driving_range',
    bayNumber: 'B-05',
    date: '2024-05-22',
    startTime: '09:00',
    endTime: '11:30',
    duration: 150,
    status: 'approved',
    numberOfPeople: 2,
    equipmentRentals: [],
    fees: [
      {
        id: 'fee-005',
        name: '打位费（2.5小时）',
        category: 'green_fee',
        amount: 450,
        prepaidApplicable: true
      },
      {
        id: 'fee-006',
        name: '练习球（2盒）',
        category: 'range_ball',
        amount: 100,
        prepaidApplicable: true
      }
    ],
    totalAmount: 550,
    prepaidDeducted: 467.5,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-22T08:55:00+08:00',
    checkOutTime: undefined,
    noShow: false,
    remark: '客户要求延长30分钟，已确认下一时段无人预约，可以安排。金卡会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T16:00:00+08:00',
    updatedAt: '2024-05-22T09:30:00+08:00'
  },
  {
    id: 'booking-003',
    bookingNo: 'BK-2024-0523-001',
    customerId: 'cust-003',
    customerName: '周女士',
    customerPhone: '13900139003',
    type: 'lesson',
    date: '2024-05-23',
    startTime: '10:00',
    endTime: '11:30',
    duration: 90,
    status: 'approved',
    numberOfPeople: 1,
    equipmentRentals: [],
    fees: [
      {
        id: 'fee-007',
        name: '1对1教练课',
        category: 'lesson',
        amount: 800,
        prepaidApplicable: true,
        description: '李教练 90分钟课程'
      }
    ],
    totalAmount: 800,
    prepaidDeducted: 680,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: undefined,
    checkOutTime: undefined,
    noShow: false,
    remark: '客户投诉CMP-2024-0521-001的补偿课程，本次免费。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T15:30:00+08:00',
    updatedAt: '2024-05-21T15:30:00+08:00'
  },
  {
    id: 'booking-004',
    bookingNo: 'BK-2024-0524-001',
    customerId: 'cust-007',
    customerName: '郑总',
    customerPhone: '13900139007',
    type: 'putting_green',
    date: '2024-05-24',
    startTime: '07:00',
    endTime: '09:00',
    duration: 120,
    status: 'pending',
    numberOfPeople: 4,
    equipmentRentals: [
      {
        id: 'rental-003',
        equipmentId: 'equipment-002',
        equipmentName: '推杆套装',
        quantity: 4,
        rentalFee: 100,
        pickedUp: false,
        returned: false
      }
    ],
    fees: [
      {
        id: 'fee-008',
        name: '果岭费（2小时）',
        category: 'green_fee',
        amount: 600,
        prepaidApplicable: true
      },
      {
        id: 'fee-009',
        name: '推杆租赁费',
        category: 'rental',
        amount: 100,
        prepaidApplicable: true
      }
    ],
    totalAmount: 700,
    prepaidDeducted: 0,
    paymentMethod: 'prepaid',
    paid: false,
    checkInTime: undefined,
    checkOutTime: undefined,
    noShow: false,
    remark: '铂金会员，提前一周预约。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-17T10:00:00+08:00',
    updatedAt: '2024-05-17T10:00:00+08:00'
  },
  {
    id: 'booking-005',
    bookingNo: 'BK-2024-0525-001',
    customerId: 'cust-001',
    customerName: '陈总',
    customerPhone: '13900139001',
    type: 'lesson',
    date: '2024-05-25',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'approved',
    numberOfPeople: 1,
    equipmentRentals: [],
    fees: [
      {
        id: 'fee-010',
        name: '1对1教练课（赠送）',
        category: 'lesson',
        amount: 0,
        prepaidApplicable: false,
        description: '投诉CMP-2024-0521-001补偿课程'
      }
    ],
    totalAmount: 0,
    prepaidDeducted: 0,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: undefined,
    checkOutTime: undefined,
    noShow: false,
    remark: '投诉处理赠送课程，李教练亲自授课。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T15:00:00+08:00',
    updatedAt: '2024-05-21T15:00:00+08:00'
  },
  {
    id: 'booking-006',
    bookingNo: 'BK-2024-0523-002',
    customerId: 'cust-004',
    customerName: '赵先生',
    customerPhone: '13900139004',
    type: 'driving_range',
    bayNumber: 'C-03',
    date: '2024-05-23',
    startTime: '15:00',
    endTime: '17:00',
    duration: 120,
    status: 'pending',
    numberOfPeople: 2,
    equipmentRentals: [
      {
        id: 'rental-004',
        equipmentId: 'equipment-003',
        equipmentName: '男士套杆',
        quantity: 1,
        rentalFee: 150,
        pickedUp: false,
        returned: false
      }
    ],
    fees: [
      {
        id: 'fee-011',
        name: '打位费（2小时）',
        category: 'green_fee',
        amount: 300,
        prepaidApplicable: true
      },
      {
        id: 'fee-012',
        name: '练习球（2盒）',
        category: 'range_ball',
        amount: 100,
        prepaidApplicable: true
      },
      {
        id: 'fee-013',
        name: '球杆租赁费',
        category: 'rental',
        amount: 150,
        prepaidApplicable: true
      }
    ],
    totalAmount: 550,
    prepaidDeducted: 0,
    paymentMethod: 'prepaid',
    paid: false,
    checkInTime: undefined,
    checkOutTime: undefined,
    noShow: false,
    remark: '',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-22T14:00:00+08:00',
    updatedAt: '2024-05-22T14:00:00+08:00'
  },
  {
    id: 'booking-007',
    bookingNo: 'BK-2024-0521-001',
    customerId: 'cust-005',
    customerName: '孙女士',
    customerPhone: '13900139005',
    type: 'chipping_area',
    date: '2024-05-21',
    startTime: '16:00',
    endTime: '17:30',
    duration: 90,
    status: 'completed',
    numberOfPeople: 1,
    equipmentRentals: [
      {
        id: 'rental-005',
        equipmentId: 'equipment-003',
        equipmentName: '男士套杆',
        quantity: 1,
        rentalFee: 150,
        pickedUp: true,
        pickedUpAt: '2024-05-21T15:55:00+08:00',
        returned: true,
        returnedAt: '2024-05-21T17:35:00+08:00',
        returnedCondition: 'damaged',
        returnCheckBy: '王前台'
      }
    ],
    fees: [
      {
        id: 'fee-014',
        name: '切杆果岭费',
        category: 'green_fee',
        amount: 200,
        prepaidApplicable: true
      },
      {
        id: 'fee-015',
        name: '球杆租赁费',
        category: 'rental',
        amount: 150,
        prepaidApplicable: true
      }
    ],
    totalAmount: 350,
    prepaidDeducted: 315,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-21T15:50:00+08:00',
    checkOutTime: '2024-05-21T17:40:00+08:00',
    noShow: false,
    remark: '归还时发现7号铁杆头有松动，已登记维修。银卡会员享受9折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T15:45:00+08:00',
    updatedAt: '2024-05-21T17:45:00+08:00'
  }
]
