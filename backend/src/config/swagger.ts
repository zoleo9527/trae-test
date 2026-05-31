import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '钟表售后-配件申请与库存锁定系统 API',
      version: '1.0.0',
      description: `
## 系统概述

本系统为钟表售后维修业务提供完整的配件申请与库存锁定管理解决方案，核心能力包括：

### 核心功能
- **寄修单管理**：完整的寄修单生命周期管理，从接件、报价、确认、维修到取件结案
- **配件申请流程**：支持创建、提交、审批、驳回、补录、发放的完整接力流程
- **库存锁定机制**：审批通过后自动锁定库存，防止超卖，支持锁定释放和过期清理
- **多角色协作**：接件顾问、维修技师、售后经理各负其责，权限边界清晰
- **证据链完整**：全链路操作日志、状态历史、备注系统，支持异常回查
- **数据导出**：支持CSV/JSON格式导出，满足报表需求

### 角色说明
- **ADMIN (系统管理员)**: 拥有全部权限，可管理用户和系统配置
- **SERVICE_MANAGER (售后经理)**: 可审批配件申请、管理库存、查看全部数据
- **RECEPTIONIST (接件顾问)**: 可创建寄修单、提交配件申请、与客户沟通
- **TECHNICIAN (维修技师)**: 可查看维修任务、创建配件申请、领取配件

### API 基础信息
- Base URL: ${config.apiVersion}
- 认证方式: Bearer Token (JWT)
- 所有接口返回格式统一为: { code, message, data, traceId }

### 状态流转
系统严格定义了寄修单和配件申请单的状态流转规则，非法流转将被拒绝。
详细流转规则可查看各模块的 /status-transitions 接口。
      `,
      contact: {
        name: '售后系统支持',
        email: 'support@watch-service.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiVersion}`,
        description: '开发环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌，通过 /auth/login 接口获取',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: '认证',
        description: '用户登录、认证相关接口',
      },
      {
        name: '用户管理',
        description: '用户增删改查、权限管理',
      },
      {
        name: '寄修单管理',
        description: '寄修单的创建、查询、状态流转等操作',
      },
      {
        name: '配件与库存管理',
        description: '配件目录、库存、锁定管理',
      },
      {
        name: '配件申请管理',
        description: '配件申请的创建、提交、审批、驳回、补录、发放等核心流程',
      },
      {
        name: '通用查询与导出',
        description: '数据导出、仪表板、操作日志、链路追踪',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const specs = swaggerJsdoc(options);

export default specs;
