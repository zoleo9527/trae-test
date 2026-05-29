"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./lib/logger"));
const auth_1 = __importDefault(require("./routes/auth"));
const rental_1 = __importDefault(require("./routes/rental"));
const deposit_1 = __importDefault(require("./routes/deposit"));
const damageClaim_1 = __importDefault(require("./routes/damageClaim"));
const maintenance_1 = __importDefault(require("./routes/maintenance"));
const common_1 = __importDefault(require("./routes/common"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        query: req.query,
        hasBody: Object.keys(req.body || {}).length > 0,
    });
    next();
});
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/rentals', rental_1.default);
app.use('/api/deposits', deposit_1.default);
app.use('/api/damage-claims', damageClaim_1.default);
app.use('/api/maintenances', maintenance_1.default);
app.use('/api', common_1.default);
app.get('/api', (req, res) => {
    res.json({
        success: true,
        data: {
            name: '乐器租赁-押金结算与损坏申诉服务',
            version: '1.0.0',
            endpoints: {
                auth: '/api/auth',
                rentals: '/api/rentals',
                deposits: '/api/deposits',
                damageClaims: '/api/damage-claims',
                maintenances: '/api/maintenances',
                instruments: '/api/instruments',
                customers: '/api/customers',
                auditLogs: '/api/audit-logs',
                notes: '/api/notes',
            },
        },
    });
});
app.use(errorHandler_1.errorHandler);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        code: 404,
    });
});
app.listen(PORT, () => {
    logger_1.default.info(`服务器启动成功，端口: ${PORT}`);
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     乐器租赁-押金结算与损坏申诉后端服务已启动             ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                         ║
║  API文档:  http://localhost:${PORT}/api                      ║
║  健康检查: http://localhost:${PORT}/api/health               ║
╠════════════════════════════════════════════════════════════╣
║  测试账号:                                                  ║
║  门店老板:   owner / 123456                                ║
║  租赁顾问:   advisor / 123456                              ║
║  维修师傅:   tech / 123456                                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});
