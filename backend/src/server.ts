import app from './app';
import { config } from './config';
import prisma from './config/prisma';

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  钟表售后-配件申请与库存锁定系统                            ║
║                                                            ║
║  🚀 Server running at:   http://localhost:${config.port}${config.apiVersion}
║                                                            ║
║  📚 API Docs:            http://localhost:${config.port}/api-docs
║                                                            ║
║  💊 Health Check:        http://localhost:${config.port}/health
║                                                            ║
║  👤 Test Accounts:                                         
║     admin / admin123    (系统管理员)                       
║     manager / manager123 (售后经理)                       
║     reception / rec123  (接件顾问)                         
║     tech / tech123      (维修技师)                         
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

main();
