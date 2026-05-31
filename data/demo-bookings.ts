import type { Booking, EquipmentRental, BookingFee } from '~/types'

export const demoCustomerBookings: Booking[] = [
  {
    id: 'booking-demo-001',
    bookingNo: 'BK-2024-0515-001',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'driving_range',
    bayNumber: 'A-05',
    date: '2024-05-15',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    status: 'completed',
    numberOfPeople: 2,
    equipmentRentals: [
      {
        id: 'rental-demo-001',
        equipmentId: 'equipment-001',
        equipmentName: '职业套杆组',
        quantity: 1,
        rentalFee: 200,
        pickedUp: true,
        pickedUpAt: '2024-05-15T09:55:00+08:00',
        returned: true,
        returnedAt: '2024-05-15T12:10:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      }
    ],
    fees: [
      {
        id: 'fee-demo-001',
        name: '打位费（2小时）',
        category: 'green_fee',
        amount: 400,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-002',
        name: '练习球（2盒）',
        category: 'range_ball',
        amount: 100,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-003',
        name: '球杆租赁费',
        category: 'rental',
        amount: 200,
        prepaidApplicable: true
      }
    ],
    totalAmount: 700,
    prepaidDeducted: 595,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-15T09:58:00+08:00',
    checkOutTime: '2024-05-15T12:15:00+08:00',
    noShow: false,
    remark: '首次来场，对场地和服务都很满意。铂金会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-14T16:00:00+08:00',
    updatedAt: '2024-05-15T12:20:00+08:00'
  },
  {
    id: 'booking-demo-002',
    bookingNo: 'BK-2024-0517-001',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'lesson',
    date: '2024-05-17',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'completed',
    numberOfPeople: 1,
    equipmentRentals: [],
    fees: [
      {
        id: 'fee-demo-004',
        name: '1对1教练课',
        category: 'lesson',
        amount: 800,
        prepaidApplicable: true,
        description: '李教练 90分钟挥杆课程'
      }
    ],
    totalAmount: 800,
    prepaidDeducted: 680,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-17T13:50:00+08:00',
    checkOutTime: '2024-05-17T15:45:00+08:00',
    noShow: false,
    remark: '客户表示课程很有收获，预约下周继续。铂金会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-16T10:00:00+08:00',
    updatedAt: '2024-05-17T15:50:00+08:00'
  },
  {
    id: 'booking-demo-003',
    bookingNo: 'BK-2024-0520-002',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'driving_range',
    bayNumber: 'A-08',
    date: '2024-05-20',
    startTime: '14:00',
    endTime: '17:00',
    duration: 180,
    status: 'completed',
    numberOfPeople: 4,
    equipmentRentals: [
      {
        id: 'rental-demo-002',
        equipmentId: 'equipment-002',
        equipmentName: '推杆套装',
        quantity: 4,
        rentalFee: 100,
        pickedUp: true,
        pickedUpAt: '2024-05-20T13:50:00+08:00',
        returned: true,
        returnedAt: '2024-05-20T17:20:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      },
      {
        id: 'rental-demo-003',
        equipmentId: 'equipment-004',
        equipmentName: '测距仪',
        quantity: 2,
        rentalFee: 50,
        pickedUp: true,
        pickedUpAt: '2024-05-20T13:50:00+08:00',
        returned: true,
        returnedAt: '2024-05-20T17:20:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      }
    ],
    fees: [
      {
        id: 'fee-demo-005',
        name: '打位费（3小时）',
        category: 'green_fee',
        amount: 600,
        prepaidApplicable: true,
        description: 'A区VIP打位，4人同时使用'
      },
      {
        id: 'fee-demo-006',
        name: '练习球（5盒）',
        category: 'range_ball',
        amount: 250,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-007',
        name: '推杆租赁费',
        category: 'rental',
        amount: 100,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-008',
        name: '测距仪租赁费',
        category: 'rental',
        amount: 100,
        prepaidApplicable: true
      }
    ],
    totalAmount: 1050,
    prepaidDeducted: 892.5,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-20T13:55:00+08:00',
    checkOutTime: '2024-05-20T17:25:00+08:00',
    noShow: false,
    remark: '带朋友一起来，客户很满意。但3号发球台草坪有问题，客户反馈后已登记投诉。铂金会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-19T11:00:00+08:00',
    updatedAt: '2024-05-20T17:30:00+08:00'
  },
  {
    id: 'booking-demo-004',
    bookingNo: 'BK-2024-0522-001',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'putting_green',
    date: '2024-05-22',
    startTime: '08:00',
    endTime: '10:00',
    duration: 120,
    status: 'completed',
    numberOfPeople: 2,
    equipmentRentals: [
      {
        id: 'rental-demo-004',
        equipmentId: 'equipment-005',
        equipmentName: '高尔夫球包',
        quantity: 1,
        rentalFee: 30,
        pickedUp: true,
        pickedUpAt: '2024-05-22T07:55:00+08:00',
        returned: true,
        returnedAt: '2024-05-22T10:10:00+08:00',
        returnedCondition: 'good',
        returnCheckBy: '王前台'
      }
    ],
    fees: [
      {
        id: 'fee-demo-009',
        name: '果岭费（2小时）',
        category: 'green_fee',
        amount: 400,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-010',
        name: '球包租赁费',
        category: 'rental',
        amount: 30,
        prepaidApplicable: true
      }
    ],
    totalAmount: 430,
    prepaidDeducted: 365.5,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-22T07:58:00+08:00',
    checkOutTime: '2024-05-22T10:15:00+08:00',
    noShow: false,
    remark: '客户一早来练推杆，对投诉处理结果表示满意。铂金会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T16:30:00+08:00',
    updatedAt: '2024-05-22T10:20:00+08:00'
  },
  {
    id: 'booking-demo-005',
    bookingNo: 'BK-2024-0525-002',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'lesson',
    date: '2024-05-25',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'completed',
    numberOfPeople: 1,
    equipmentRentals: [],
    fees: [
      {
        id: 'fee-demo-011',
        name: '1对1教练课（投诉补偿）',
        category: 'lesson',
        amount: 0,
        prepaidApplicable: false,
        description: '投诉CMP-DEMO-001补偿课程，李教练亲自授课'
      }
    ],
    totalAmount: 0,
    prepaidDeducted: 0,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-25T13:55:00+08:00',
    checkOutTime: '2024-05-25T15:40:00+08:00',
    noShow: false,
    remark: '投诉处理赠送课程，客户对李教练的指导非常满意。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-21T15:00:00+08:00',
    updatedAt: '2024-05-25T15:45:00+08:00'
  },
  {
    id: 'booking-demo-006',
    bookingNo: 'BK-2024-0528-001',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    type: 'driving_range',
    bayNumber: 'A-03',
    date: '2024-05-28',
    startTime: '15:00',
    endTime: '18:00',
    duration: 180,
    status: 'approved',
    numberOfPeople: 3,
    equipmentRentals: [
      {
        id: 'rental-demo-005',
        equipmentId: 'equipment-001',
        equipmentName: '职业套杆组',
        quantity: 2,
        rentalFee: 200,
        pickedUp: true,
        pickedUpAt: '2024-05-28T14:50:00+08:00',
        returned: false
      },
      {
        id: 'rental-demo-006',
        equipmentId: 'equipment-004',
        equipmentName: '测距仪',
        quantity: 1,
        rentalFee: 50,
        pickedUp: true,
        pickedUpAt: '2024-05-28T14:50:00+08:00',
        returned: false
      }
    ],
    fees: [
      {
        id: 'fee-demo-012',
        name: '打位费（3小时）',
        category: 'green_fee',
        amount: 600,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-013',
        name: '练习球（4盒）',
        category: 'range_ball',
        amount: 200,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-014',
        name: '球杆租赁费',
        category: 'rental',
        amount: 400,
        prepaidApplicable: true
      },
      {
        id: 'fee-demo-015',
        name: '测距仪租赁费',
        category: 'rental',
        amount: 50,
        prepaidApplicable: true
      }
    ],
    totalAmount: 1250,
    prepaidDeducted: 1062.5,
    paymentMethod: 'prepaid',
    paid: true,
    checkInTime: '2024-05-28T14:55:00+08:00',
    checkOutTime: undefined,
    noShow: false,
    remark: '正在进行中，客户还有2套球杆和1个测距仪未归还。铂金会员享受85折。',
    operatorId: 'user-003',
    operatorName: '王前台',
    createdAt: '2024-05-27T09:00:00+08:00',
    updatedAt: '2024-05-28T15:30:00+08:00'
  }
]
