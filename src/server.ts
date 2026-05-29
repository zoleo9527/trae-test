import app from './app';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { config } from './config';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 服务器启动成功`);
  logger.info(`📍 本地地址: http://localhost:${PORT}`);
  logger.info(`🔗 API 基础路径: http://localhost:${PORT}/api`);
  logger.info(`📊 健康检查: http://localhost:${PORT}/api/health`);
  logger.info(`🏠 仪表盘: http://localhost:${PORT}/api/dashboard`);
  logger.info(`👤 登录接口: POST http://localhost:${PORT}/api/auth/login`);
  logger.info(`🌍 环境: ${config.nodeEnv}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`收到 ${signal} 信号，正在优雅关闭...`);

  server.close(async () => {
    logger.info('HTTP 服务器已关闭');

    try {
      await prisma.$disconnect();
      logger.info('数据库连接已关闭');
      process.exit(0);
    } catch (error) {
      logger.error('关闭数据库连接失败', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('强制关闭超时，退出进程');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', { reason, promise });
  process.exit(1);
});

export default server;
