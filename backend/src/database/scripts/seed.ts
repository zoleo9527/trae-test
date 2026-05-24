import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { User, UserRole, Member, MemberLevel } from '../entities';

async function seedDatabase() {
  try {
    console.log('正在初始化数据库...');
    await AppDataSource.initialize();
    console.log('数据库连接成功！');

    const userRepository = AppDataSource.getRepository(User);
    const memberRepository = AppDataSource.getRepository(Member);

    console.log('创建默认用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      {
        username: 'admin',
        password: hashedPassword,
        realName: '系统管理员',
        phone: '13800000001',
        role: UserRole.ADMIN,
      },
      {
        username: 'manager',
        password: hashedPassword,
        realName: '门店经理',
        phone: '13800000002',
        role: UserRole.MANAGER,
      },
      {
        username: 'sales',
        password: hashedPassword,
        realName: '销售员',
        phone: '13800000003',
        role: UserRole.SALES,
      },
      {
        username: 'workshop',
        password: hashedPassword,
        realName: '工坊师傅',
        phone: '13800000004',
        role: UserRole.WORKSHOP,
      },
      {
        username: 'cs',
        password: hashedPassword,
        realName: '客服专员',
        phone: '13800000005',
        role: UserRole.CUSTOMER_SERVICE,
      },
    ];

    for (const userData of users) {
      const existing = await userRepository.findOne({
        where: { username: userData.username },
      });
      if (!existing) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(`已创建用户: ${userData.username} / ${userData.realName}`);
      } else {
        console.log(`用户已存在: ${userData.username}`);
      }
    }

    console.log('创建示例会员...');
    const sampleMembers = [
      {
        memberNo: 'M20240100001',
        realName: '张三',
        phone: '13900000001',
        gender: '男',
        level: MemberLevel.GOLD,
        totalConsumption: 58000,
        points: 5800,
        remark: 'VIP客户，偏好钻石饰品',
      },
      {
        memberNo: 'M20240100002',
        realName: '李四',
        phone: '13900000002',
        gender: '女',
        level: MemberLevel.PLATINUM,
        totalConsumption: 128000,
        points: 12800,
        remark: '结婚纪念套装客户',
      },
      {
        memberNo: 'M20240100003',
        realName: '王五',
        phone: '13900000003',
        gender: '女',
        level: MemberLevel.SILVER,
        totalConsumption: 15000,
        points: 1500,
      },
    ];

    for (const memberData of sampleMembers) {
      const existing = await memberRepository.findOne({
        where: { phone: memberData.phone },
      });
      if (!existing) {
        const member = memberRepository.create(memberData);
        await memberRepository.save(member);
        console.log(`已创建会员: ${memberData.realName}`);
      } else {
        console.log(`会员已存在: ${memberData.realName}`);
      }
    }

    console.log('');
    console.log('========================================');
    console.log('种子数据初始化完成！');
    console.log('');
    console.log('默认账号:');
    console.log('  admin / 123456 (管理员)');
    console.log('  manager / 123456 (门店经理)');
    console.log('  sales / 123456 (销售员)');
    console.log('  workshop / 123456 (工坊师傅)');
    console.log('  cs / 123456 (客服专员)');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('种子数据初始化失败:', error);
    process.exit(1);
  }
}

seedDatabase();
