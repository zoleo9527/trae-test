import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  async login(@Request() req) {
    const user = await this.authService.validateUser(req.body.username, req.body.password);
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户信息' })
  getProfile(@Request() req) {
    return req.user;
  }
}
