import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { generateToken, comparePassword } from '../lib/auth'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validate'
import { loginSchema } from '../lib/validation'
import { AuthenticatedRequest } from '../types'

const router = Router()

router.post('/login', validateRequest(loginSchema), async (req, res: Response, next) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
        code: 401,
      })
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as any,
    })

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
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  })
})

export default router
