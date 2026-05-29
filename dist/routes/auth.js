"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../lib/auth");
const auth_2 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const router = (0, express_1.Router)();
router.post('/login', (0, validate_1.validateRequest)(validation_1.loginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { username },
        });
        if (!user || !(0, auth_1.comparePassword)(password, user.password)) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误',
                code: 401,
            });
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                },
            },
            message: '登录成功',
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', auth_2.authenticate, (req, res) => {
    res.json({
        success: true,
        data: req.user,
    });
});
exports.default = router;
