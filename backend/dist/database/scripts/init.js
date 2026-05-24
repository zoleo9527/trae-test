"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("../data-source");
async function initDatabase() {
    try {
        console.log('正在初始化数据库...');
        await data_source_1.AppDataSource.initialize();
        console.log('数据库连接成功！');
        console.log('数据表已自动创建');
        process.exit(0);
    }
    catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}
initDatabase();
//# sourceMappingURL=init.js.map