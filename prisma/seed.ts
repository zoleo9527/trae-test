import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      password,
      name: '张经理',
      role: Role.SHOWROOM_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { username: 'sales1' },
    update: {},
    create: {
      username: 'sales1',
      password,
      name: '李销售',
      role: Role.SALES_CONSULTANT,
    },
  });

  await prisma.user.upsert({
    where: { username: 'sales2' },
    update: {},
    create: {
      username: 'sales2',
      password,
      name: '王销售',
      role: Role.SALES_CONSULTANT,
    },
  });

  await prisma.user.upsert({
    where: { username: 'install' },
    update: {},
    create: {
      username: 'install',
      password,
      name: '赵协调',
      role: Role.INSTALL_COORDINATOR,
    },
  });

  const samples = [
    { name: '北欧风三人沙发', sku: 'SF-001', category: '沙发', location: 'A区-01', description: '浅灰色布艺沙发' },
    { name: '实木餐桌', sku: 'TB-001', category: '餐桌', location: 'B区-03', description: '北美黑胡桃木' },
    { name: '简约餐椅', sku: 'CH-001', category: '餐椅', location: 'B区-05', description: '北欧简约风格' },
    { name: '轻奢茶几', sku: 'CT-001', category: '茶几', location: 'A区-02', description: '岩板台面' },
    { name: '主卧大床', sku: 'BD-001', category: '床', location: 'C区-01', description: '真皮软包床头' },
    { name: '两门衣柜', sku: 'WD-001', category: '衣柜', location: 'C区-02', description: '浅胡桃色' },
  ];

  for (const s of samples) {
    await prisma.sample.upsert({
      where: { sku: s.sku },
      update: {},
      create: s,
    });
  }

  console.log('Seed data created successfully!');
  console.log('Accounts: manager/123456, sales1/123456, sales2/123456, install/123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
