# 展会搭建进场证件与人员签到系统

## 项目概述

针对展会搭建行业的痛点：项目排期、证件办理、物料管理、供应商对账在多个系统间割裂，数据重复录入、版本混乱、责任不清等问题。

本系统将**项目统筹、进场证件、人员签到、物料管理、供应商对账**整合在同一工作面，实现：
- 项目统筹做判断 → 项目全生命周期管理
- 现场执行做执行 → 证件办理、现场签到
- 供应商对接做复核 → 物料版本、对账确认

## 技术栈

- **后端框架**: NestJS 10.x
- **数据库**: PostgreSQL 14+
- **ORM**: TypeORM
- **API文档**: Swagger/OpenAPI
- **导出**: ExcelJS + CSV Writer

## 核心业务模型

### 1. 项目 (Project)
**状态流转**: `草稿 → 已排期 → 筹备中 → 进行中 → 已完成`
**阶段**: 搭建前 → 搭建期 → 展期 → 撤场期

### 2. 进场证件 (Credential)
**状态流转**: `草稿 → 已提交 → 审核中 → 已批准/已拒绝 → 已打印 → 已发放 → 已归还/已过期`
**证件类型**: 施工人员、电工、高空作业、焊工、司机、督导、访客

### 3. 人员签到 (Checkin)
**类型**: 进场、退场
**状态**: 正常、迟到、早退、加班、异常

### 4. 物料管理 (Material)
**状态流转**: `草稿 → 待审核 → 已批准/已拒绝 → 已送达 → 已安装/损坏 → 已归还`
**关键特性**: 版本控制（保留所有历史版本）

### 5. 供应商对账 (Settlement)
**状态流转**: `草稿 → 待确认 → 供应商已确认 → 审核中 → 审核通过/拒绝 → 待付款 → 已付款`

## 快速开始

### 1. 环境准备
```bash
# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env
```

### 2. 数据库配置
确保PostgreSQL已启动，创建数据库：
```sql
CREATE DATABASE exhibition_access;
```

### 3. 启动服务
```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 4. 导入测试数据
```bash
npm run seed
```

服务启动后访问：
- API文档: http://localhost:3000/api/docs
- 健康检查: http://localhost:3000/api/ (需自行添加)

## API 接口一览

### 项目管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 项目列表（分页、筛选） |
| GET | `/api/projects/:id` | 项目详情 |
| GET | `/api/projects/:id/dashboard` | 项目看板 |
| PUT | `/api/projects/:id/status` | 更新项目状态 |
| PUT | `/api/projects/:id/phase` | 更新项目阶段 |

### 进场证件
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/credentials` | 证件列表 |
| GET | `/api/credentials/:id` | 证件详情 |
| GET | `/api/credentials/:id/history` | 状态历史 |
| GET | `/api/credentials/export` | 导出Excel/CSV |
| GET | `/api/credentials/stats` | 证件统计 |
| POST | `/api/credentials/batch` | 批量创建 |
| PUT | `/api/credentials/:id/status` | 更新证件状态 |

### 人员签到
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/checkins` | 签到记录 |
| GET | `/api/checkins/today` | 今日签到列表 |
| GET | `/api/checkins/stats` | 签到统计 |
| POST | `/api/checkins/manual` | 人工签到（身份证号） |
| GET | `/api/checkins/export` | 导出签到记录 |

### 物料管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/materials` | 物料列表 |
| GET | `/api/materials/:id` | 物料详情 |
| GET | `/api/materials/versions/:materialNo` | 版本历史 |
| POST | `/api/materials/:id/version` | 创建新版本 |
| PUT | `/api/materials/:id/status` | 更新物料状态 |
| GET | `/api/materials/export` | 导出物料清单 |

### 供应商对账
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settlements` | 对账单列表 |
| GET | `/api/settlements/:id` | 对账单详情 |
| PUT | `/api/settlements/:id/status` | 更新对账状态 |
| POST | `/api/settlements/:id/supplier-confirm` | 供应商确认 |
| GET | `/api/settlements/export` | 导出对账单 |

## 测试场景（seed 数据已包含）

### ✅ 正常流程场景
1. **证件办理全链路**: PRJ2025001项目，王建国的证件
   - 草稿 → 提交 → 审核 → 批准 → 打印 → 发放
   - 可查看完整状态历史

2. **物料版本管理**: 木结构展台主体
   - 审核 → 批准 → 送达 → 安装
   - 版本追踪完整

3. **供应商对账完成**: PRJ2025003项目
   - 供应商确认 → 财务审核 → 已付款

### ❌ 问题流程场景
1. **证件漏办/被拒**: PRJ2025002项目
   - 赵强的电工证被拒（特种证过期）
   - 孙磊的高空作业证还在草稿（漏办）

2. **物料版本混乱**: 接待台石材
   - V1: 爵士白大理石 → 被拒
   - V2: 鱼肚白大理石 → 待审核
   - 可通过 `/materials/versions/MAT-xxx` 查看版本对比

3. **对账争议中**: PRJ2025001电力项目
   - 供应商要求加3万，状态进入 DISPUTED

## 设计取舍点

### 1. 状态机设计
**取舍**: 轻量级状态机 vs 完整工作流引擎
- **当前方案**: 基于服务层的状态转换校验 + 状态日志表
- **理由**: 展会行业状态流转相对固定，轻量级足够
- **扩展点**: 如需复杂审批流，可接入 Camunda 或 NestJS bull 队列

### 2. 物料版本管理
**取舍**: 快照模式 vs 增量模式
- **当前方案**: 新版本 = 新记录（materialNo相同，version递增）
- **理由**: 物料规格变更需要完整回退能力
- **权衡**: 数据量会增加，但查询简单

### 3. 权限模型
**取舍**: RBAC完整权限 vs 按角色硬编码
- **当前方案**: 未实现认证授权（seed数据中operator字段仅记录）
- **理由**: 优先落地业务流程，权限可后续叠加
- **扩展点**: 接入 @nestjs/jwt + CASL/AccessControl

### 4. 实时性要求
**取舍**: WebSocket推送 vs 轮询
- **当前方案**: REST API + 客户端轮询
- **理由**: 签到数据秒级延迟可接受
- **扩展点**: 接入 Socket.IO 实现实时签到看板

### 5. 文件存储
**取舍**: 本地文件 vs OSS
- **当前方案**: JSON字段存文件元数据（实际上传未实现）
- **理由**: 与业务逻辑解耦
- **扩展点**: 接入 Multer + 阿里云OSS

## 后续可扩展方向

### 短期（1-2个月）
1. **认证授权**: JWT登录 + 角色权限（项目统筹/现场执行/供应商）
2. **移动端签到**: 微信小程序 + 二维码扫码签到
3. **消息通知**: 证件审批通知、物料到期提醒
4. **报表看板**: 项目健康度大盘、供应商评级

### 中期（3-6个月）
1. **工作流引擎**: 自定义审批流程
2. **电子签章**: 对账单在线签署
3. **财务集成**: 对接金蝶/用友自动生成凭证
4. **BI分析**: 多维度数据透视（成本、时效、质量）

### 长期（6个月+）
1. **物联网集成**: 闸机对接、蓝牙信标室内定位
2. **AI风险预警**: 基于历史数据预测证件办理延误风险
3. **供应商平台**: 供应商自助服务门户
4. **行业SaaS化**: 多租户架构

## 目录结构
```
src/
├── common/              # 公共模块
│   ├── enums/          # 枚举定义
│   ├── filters/        # 异常过滤器
│   ├── dto/            # 通用DTO
│   └── services/       # 通用服务（状态机、导出、查询构建）
├── entities/           # 数据库实体
├── modules/            # 业务模块
│   ├── project/        # 项目管理
│   ├── credential/     # 进场证件
│   ├── checkin/        # 人员签到
│   ├── material/       # 物料管理
│   ├── settlement/     # 供应商对账
│   ├── supplier/       # 供应商管理
│   └── person/         # 人员管理
├── config/             # 配置文件
├── database/           # 数据种子
├── app.module.ts
└── main.ts
```

## 常见问题

### Q: 为什么没有前端？
A: 按需求"前端可以轻，但后端别轻"的要求，优先保证后端API的完整性。
可快速接入：
- 低代码平台（宜搭/明道云）
- 自建React/Vue管理后台
- 微信小程序

### Q: 如何处理并发更新？
A: 当前版本未实现乐观锁，高并发场景建议：
```typescript
// 在实体中添加 version 字段
@VersionColumn()
version: number;
```

### Q: 为什么用UUID而不是自增ID？
A: 分布式部署友好，避免ID序列泄露业务数据量。

## License
UNLICENSED
