<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <span>📖 系统说明</span>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="🎯 业务流程" name="flow">
          <div class="tab-content">
            <h3>会员积分与兑换核销业务接力流程</h3>
            
            <el-steps :active="4" finish-status="success" align-center>
              <el-step title="会员申请兑换" description="店长协助" />
              <el-step title="店长确认订单" description="冻结积分" />
              <el-step title="仓管配货发货" description="扣减库存" />
              <el-step title="门店收货确认" description="生成核销码" />
              <el-step title="到店核销完成" description="积分扣减" />
            </el-steps>

            <el-row :gutter="20" style="margin-top: 30px;">
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="role-header">
                      <span>👨‍💼 店长</span>
                      <el-tag type="primary">门店端</el-tag>
                    </div>
                  </template>
                  <ul class="role-list">
                    <li>✅ 会员兑换申请</li>
                    <li>✅ 订单确认审核</li>
                    <li>✅ 收货确认</li>
                    <li>✅ 到店核销</li>
                    <li>✅ 巡店问题上报</li>
                    <li>✅ 会员积分查询</li>
                  </ul>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="role-header">
                      <span>👩‍💻 企划专员</span>
                      <el-tag type="success">总部端</el-tag>
                    </div>
                  </template>
                  <ul class="role-list">
                    <li>✅ 商品上下架管理</li>
                    <li>✅ 联名商品同步</li>
                    <li>✅ 积分规则制定</li>
                    <li>✅ 异常订单处理</li>
                    <li>✅ 巡店问题跟进</li>
                    <li>✅ 数据看板分析</li>
                  </ul>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="role-header">
                      <span>👷 仓管</span>
                      <el-tag type="warning">仓库端</el-tag>
                    </div>
                  </template>
                  <ul class="role-list">
                    <li>✅ 待发货订单处理</li>
                    <li>✅ 库存调整盘点</li>
                    <li>✅ 出入库记录</li>
                    <li>✅ 库存预警监控</li>
                    <li>✅ 商品补货管理</li>
                    <li>✅ 物流跟踪</li>
                  </ul>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="⚖️ 当前取舍" name="tradeoff">
          <div class="tab-content">
            <h3>当前实现的技术与业务取舍</h3>
            
            <el-alert 
              title="架构取舍" 
              type="info" 
              :closable="false"
              style="margin-bottom: 20px;"
            >
              为了快速验证业务价值，当前版本采用纯前端架构，数据存储在内存中。
            </el-alert>

            <el-table :data="tradeoffList" size="default">
              <el-table-column prop="area" label="领域" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.type">{{ row.area }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="decision" label="当前决策" width="250" />
              <el-table-column prop="reason" label="取舍原因" />
              <el-table-column prop="impact" label="影响" width="150">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.impact === '低' ? 'success' : row.impact === '中' ? 'warning' : 'danger'">
                    {{ row.impact }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

            <h4 style="margin-top: 30px;">主要取舍点说明：</h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="1. 纯前端 vs 前后端分离">
                采用纯前端实现，数据存储在 Pinia store 中。优点是快速迭代，缺点是数据不持久化、多用户不同步。
              </el-descriptions-item>
              <el-descriptions-item label="2. 内存状态 vs 数据库">
                所有数据操作在内存完成，刷新页面后重置。适合演示和业务流程验证。
              </el-descriptions-item>
              <el-descriptions-item label="3. 单店模拟 vs 多门店">
                当前模拟3家门店，但实际数据未按门店严格隔离。重点验证业务流程而非多租户架构。
              </el-descriptions-item>
              <el-descriptions-item label="4. 模拟联名方 vs 真实API">
                联名商品同步采用模拟机制，未对接真实第三方API。验证同步异常处理流程。
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🚀 扩展方向" name="extend">
          <div class="tab-content">
            <h3>后续可扩展的功能与架构方向</h3>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>🏗️ 架构扩展</span>
                  </template>
                  <el-timeline>
                    <el-timeline-item timestamp="优先级: 高" placement="top" type="primary">
                      <h4>后端服务化</h4>
                      <p>构建 Node.js/Python 后端 API，实现数据持久化</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 高" type="success">
                      <h4>数据库设计</h4>
                      <p>PostgreSQL + Redis 缓存，支持高并发</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 中" type="warning">
                      <h4>消息队列</h4>
                      <p>RabbitMQ/Kafka 处理积分事件、库存同步</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 中">
                      <h4>微服务拆分</h4>
                      <p>会员服务、商品服务、订单服务独立部署</p>
                    </el-timeline-item>
                  </el-timeline>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>✨ 业务功能扩展</span>
                  </template>
                  <el-timeline>
                    <el-timeline-item timestamp="优先级: 高" type="danger">
                      <h4>联名方对接</h4>
                      <p>真实 API 对接，实现库存、订单双向同步</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 高" type="primary">
                      <h4>短信/消息通知</h4>
                      <p>兑换成功、核销提醒、物流状态推送</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 中" type="success">
                      <h4>小程序端</h4>
                      <p>会员自助兑换、积分查询小程序</p>
                    </el-timeline-item>
                    <el-timeline-item timestamp="优先级: 低" type="warning">
                      <h4>BI 报表系统</h4>
                      <p>多维度数据分析、自动报表生成</p>
                    </el-timeline-item>
                  </el-timeline>
                </el-card>
              </el-col>
            </el-row>

            <el-card style="margin-top: 20px;">
              <template #header>
                <span>🔗 关键集成点</span>
              </template>
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="integration-item">
                    <div class="icon">📱</div>
                    <div class="title">微信公众号</div>
                    <div class="desc">模板消息推送</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="integration-item">
                    <div class="icon">📦</div>
                    <div class="title">物流 API</div>
                    <div class="desc">快递100/菜鸟</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="integration-item">
                    <div class="icon">🏛️</div>
                    <div class="title">联名方系统</div>
                    <div class="desc">库存订单同步</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="integration-item">
                    <div class="icon">📊</div>
                    <div class="title">财务系统</div>
                    <div class="desc">积分成本核算</div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🧪 测试样例" name="demo">
          <div class="tab-content">
            <h3>可测试的业务场景样例</h3>

            <el-alert 
              title="正常流场景（推荐先测试）" 
              type="success" 
              :closable="false"
              style="margin-bottom: 20px;"
            />

            <el-steps direction="vertical" :active="5">
              <el-step title="1. 登录店长账号" description="选择 张店长 (文创旗舰店)">
                <template #extra>
                  <el-tag type="primary" size="small">角色: 店长</el-tag>
                </template>
              </el-step>
              <el-step title="2. 会员兑换申请">
                <template #description>
                  <p>进入【会员管理】→ 选择 王小明 → 点击【兑换】</p>
                  <p>选择 故宫联名书签套装(2000积分) → 确认兑换</p>
                </template>
                <template #extra>
                  <el-tag type="success" size="small">创建订单 O001</el-tag>
                </template>
              </el-step>
              <el-step title="3. 仓管发货">
                <template #description>
                  <p>切换角色 王仓管 → 进入【库存管理】</p>
                  <p>在待发货订单中找到新订单 → 点击【确认发货】</p>
                </template>
                <template #extra>
                  <el-tag type="warning" size="small">角色切换: 仓管</el-tag>
                </template>
              </el-step>
              <el-step title="4. 门店收货确认">
                <template #description>
                  <p>切回店长账号 → 进入【订单详情】</p>
                  <p>点击【确认收货】→ 系统生成6位核销码</p>
                </template>
                <template #extra>
                  <el-tag type="info" size="small">生成核销码</el-tag>
                </template>
              </el-step>
              <el-step title="5. 到店核销完成" status="success">
                <template #description>
                  <p>进入【核销管理】→ 输入核销码 或 点击快速核销</p>
                  <p>核销成功，订单闭环！</p>
                </template>
                <template #extra>
                  <el-tag type="success" size="small">✅ 流程完成</el-tag>
                </template>
              </el-step>
            </el-steps>

            <el-divider />

            <el-alert 
              title="异常流场景（问题处理）" 
              type="warning" 
              :closable="false"
              style="margin-bottom: 20px;"
            />

            <el-row :gutter="20">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>❌ 场景一: 联名商品同步失败</span>
                  </template>
                  <ol class="demo-list">
                    <li>进入【商品管理】→ 筛选"同步异常"</li>
                    <li>找到 熊猫公仔-限定版 (同步失败)</li>
                    <li>点击【重试同步】→ 观察状态变化</li>
                    <li>同步成功后商品恢复可兑换状态</li>
                  </ol>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>⚠️ 场景二: 库存不足异常</span>
                  </template>
                  <ol class="demo-list">
                    <li>进入【订单列表】→ 筛选"异常"</li>
                    <li>查看订单 EX202401120004 (库存异常)</li>
                    <li>企划专员介入: 确认是否补货或取消订单</li>
                    <li>库存补充后订单自动恢复正常流程</li>
                  </ol>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>⏰ 场景三: 物流超时预警</span>
                  </template>
                  <ol class="demo-list">
                    <li>订单 EX202401120005 已发货超过48小时</li>
                    <li>系统标记为"超时异常"</li>
                    <li>店长收到预警通知</li>
                    <li>仓管跟进物流，确认后解除异常</li>
                  </ol>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>🔍 场景四: 巡店问题闭环</span>
                  </template>
                  <ol class="demo-list">
                    <li>进入【巡店问题】→ 点击【上报问题】</li>
                    <li>选择问题类型、填写描述后提交</li>
                    <li>相关责任人接单处理</li>
                    <li>处理完成后标记"已解决"→"已关闭"</li>
                  </ol>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('flow')

const tradeoffList = [
  { area: '数据层', type: 'info', decision: 'Pinia 内存存储', reason: '快速原型验证，无需后端开发', impact: '中' },
  { area: '用户端', type: 'primary', decision: '无真实会员端', reason: '重点验证内部协作流程', impact: '中' },
  { area: '联名方', type: 'warning', decision: '模拟同步机制', reason: '第三方API依赖大，先验证流程', impact: '高' },
  { area: '物流', type: 'danger', decision: '无真实物流对接', reason: '物流非核心业务逻辑', impact: '低' },
  { area: '权限', type: 'success', decision: '前端路由控制', reason: '演示用，后端可重写', impact: '低' },
  { area: '报表', type: 'info', decision: '前端聚合统计', reason: '数据量小，前端计算足够', impact: '中' }
]
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-content {
  padding: 10px;
}

.tab-content h3 {
  margin-bottom: 25px;
  color: #333;
}

.tab-content h4 {
  margin: 20px 0 15px;
  color: #333;
}

.role-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.role-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.role-list li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
}

.demo-list {
  padding-left: 20px;
  margin: 0;
}

.demo-list li {
  padding: 5px 0;
  color: #666;
  font-size: 14px;
}

.integration-item {
  text-align: center;
  padding: 20px;
}

.integration-item .icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.integration-item .title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.integration-item .desc {
  font-size: 12px;
  color: #999;
}
</style>
