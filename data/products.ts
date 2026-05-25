import type { Product } from '~/types'

export const products: Product[] = [
  {
    id: 'p001',
    name: '梵高向日葵金属徽章',
    sku: 'BADGE-001',
    category: '徽章配饰',
    currentStock: 45,
    minStock: 100,
    unit: '个',
    price: 35
  },
  {
    id: 'p002',
    name: '莫奈睡莲帆布袋',
    sku: 'BAG-001',
    category: '包袋系列',
    currentStock: 28,
    minStock: 50,
    unit: '个',
    price: 89
  },
  {
    id: 'p003',
    name: '达芬奇蒙娜丽莎拼图',
    sku: 'PUZZLE-001',
    category: '益智玩具',
    currentStock: 12,
    minStock: 30,
    unit: '盒',
    price: 168
  },
  {
    id: 'p004',
    name: '美术馆定制笔记本',
    sku: 'BOOK-001',
    category: '文具用品',
    currentStock: 156,
    minStock: 100,
    unit: '本',
    price: 48
  },
  {
    id: 'p005',
    name: '星空夜光马克杯',
    sku: 'CUP-001',
    category: '家居生活',
    currentStock: 8,
    minStock: 40,
    unit: '个',
    price: 78
  },
  {
    id: 'p006',
    name: '艺术大师明信片套装',
    sku: 'CARD-001',
    category: '文具用品',
    currentStock: 234,
    minStock: 150,
    unit: '套',
    price: 28
  },
  {
    id: 'p007',
    name: '雕塑复刻钥匙扣',
    sku: 'KEY-001',
    category: '徽章配饰',
    currentStock: 67,
    minStock: 80,
    unit: '个',
    price: 25
  },
  {
    id: 'p008',
    name: '限定展览丝巾',
    sku: 'SCARF-001',
    category: '服饰配件',
    currentStock: 15,
    minStock: 20,
    unit: '条',
    price: 298
  }
]
