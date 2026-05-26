"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, '用户名不能为空'),
    password: zod_1.z.string().min(1, '密码不能为空'),
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const user = await prisma_1.default.user.findUnique({
            where: { username },
        });
        if (!user) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }
        const token = (0, auth_1.signToken)({
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
        });
        res.json({
            code: 0,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    }
    catch (e) {
        if (e instanceof zod_1.z.ZodError) {
            return res.status(400).json({ code: 400, message: e.errors[0].message });
        }
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});
router.get('/me', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }
    res.json({
        code: 0,
        data: req.user,
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map