"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const user_service_1 = require("./user/user.service");
const role_enum_1 = require("./common/enums/role.enum");
const seedUsers = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        fullName: '系统管理员',
        role: role_enum_1.Role.ADMIN,
        department: '信息部',
    },
    {
        username: 'pm01',
        email: 'pm01@example.com',
        password: 'pm123456',
        fullName: '张经理',
        role: role_enum_1.Role.PROJECT_MANAGER,
        department: '工程部',
        phoneNumber: '13800138001',
    },
    {
        username: 'super01',
        email: 'super01@example.com',
        password: 'super123',
        fullName: '李主管',
        role: role_enum_1.Role.SUPERVISOR,
        department: '监理部',
        phoneNumber: '13800138002',
    },
    {
        username: 'foreman01',
        email: 'foreman01@example.com',
        password: 'foreman123',
        fullName: '王工头',
        role: role_enum_1.Role.FOREMAN,
        department: '施工队',
        phoneNumber: '13800138003',
    },
    {
        username: 'worker01',
        email: 'worker01@example.com',
        password: 'worker123',
        fullName: '赵工人',
        role: role_enum_1.Role.WORKER,
        department: '施工队',
    },
    {
        username: 'account01',
        email: 'account01@example.com',
        password: 'account123',
        fullName: '钱会计',
        role: role_enum_1.Role.ACCOUNTANT,
        department: '财务部',
    },
    {
        username: 'client01',
        email: 'client01@example.com',
        password: 'client123',
        fullName: '孙甲方',
        role: role_enum_1.Role.CLIENT,
        department: '甲方项目部',
    },
];
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userService = app.get(user_service_1.UserService);
    console.log('开始初始化数据...');
    for (const userDto of seedUsers) {
        try {
            const existingUser = await userService.findByUsername(userDto.username);
            if (existingUser) {
                console.log(`用户 ${userDto.username} 已存在，跳过`);
                continue;
            }
            await userService.create(userDto);
            console.log(`用户 ${userDto.username} 创建成功`);
        }
        catch (error) {
            console.error(`创建用户 ${userDto.username} 失败:`, error.message);
        }
    }
    console.log('');
    console.log('数据初始化完成！');
    console.log('');
    console.log('演示账号:');
    console.log('  管理员: admin / admin123');
    console.log('  项目经理: pm01 / pm123456');
    console.log('  监理: super01 / super123');
    console.log('  工头: foreman01 / foreman123');
    console.log('  工人: worker01 / worker123');
    console.log('  会计: account01 / account123');
    console.log('  甲方: client01 / client123');
    await app.close();
}
bootstrap().catch((error) => {
    console.error('初始化失败:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map