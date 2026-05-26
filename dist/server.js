"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const samples_1 = __importDefault(require("./routes/samples"));
const borrows_1 = __importDefault(require("./routes/borrows"));
const returns_1 = __importDefault(require("./routes/returns"));
const common_1 = __importDefault(require("./routes/common"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/api/health', (req, res) => {
    res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/samples', auth_2.authMiddleware, samples_1.default);
app.use('/api/borrows', auth_2.authMiddleware, borrows_1.default);
app.use('/api/returns', auth_2.authMiddleware, returns_1.default);
app.use('/api', auth_2.authMiddleware, common_1.default);
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ code: 404, message: 'API Not Found' });
    }
    else {
        res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
    }
});
app.listen(PORT, () => {
    console.log(`🚀 家具展厅样品管理系统已启动`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`📖 演示入口: http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map