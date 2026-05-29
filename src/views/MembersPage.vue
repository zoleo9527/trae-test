<template>
  <div class="members-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>👥 会员管理</span>
          <el-button type="primary" @click="showAddPoints = true">
            <el-icon><Plus /></el-icon>
            积分调整
          </el-button>
        </div>
      </template>

      <el-table :data="members" v-loading="false">
        <el-table-column prop="name" label="会员姓名" width="120">
          <template #default="{ row }">
            <div class="member-info">
              <el-avatar size="small" :style="{ background: getLevelColor(row.level) }">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="200">
          <template #default="{ row }">
            <div class="points-info">
              <span class="available">可用: <strong>{{ row.availablePoints.toLocaleString() }}</strong></span>
              <span class="frozen">冻结: {{ row.frozenPoints }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalPoints" label="累计积分" width="120">
          <template #default="{ row }">
            {{ row.totalPoints.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="registerDate" label="注册日期" width="120" />
        <el-table-column prop="lastConsumeDate" label="最后消费" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
            </el-button>
            <el-button type="success" size="small" link @click="handleExchange(row)">
              兑换
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDetail" title="会员详情" width="700px">
      <div v-if="selectedMember" class="member-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedMember.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ selectedMember.phone }}</el-descriptions-item>
          <el-descriptions-item label="会员等级">
            <el-tag :type="getLevelType(selectedMember.level)">{{ selectedMember.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册日期">{{ selectedMember.registerDate }}</el-descriptions-item>
          <el-descriptions-item label="可用积分" :span="2">
            <span style="color: #67c23a; font-size: 20px; font-weight: 600;">
              {{ selectedMember.availablePoints.toLocaleString() }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />
        
        <h4>积分流水</h4>
        <el-table :data="memberPointsRecords" size="small">
          <el-table-column prop="createTime" label="时间" width="160" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'earn' ? 'success' : row.type === 'spend' ? 'danger' : 'info'" size="small">
                {{ row.type === 'earn' ? '获取' : row.type === 'spend' ? '消耗' : row.type === 'expire' ? '过期' : '调整' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="积分" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.amount > 0 ? '#67c23a' : '#f56c6c' }">
                {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balance" label="余额" width="100" />
          <el-table-column prop="remark" label="备注" />
          <el-table-column prop="operatorName" label="操作人" width="100" />
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="showAddPoints" title="积分调整" width="500px">
      <el-form :model="pointsForm" label-width="100px">
        <el-form-item label="选择会员">
          <el-select v-model="pointsForm.memberId" placeholder="请选择会员" filterable>
            <el-option 
              v-for="m in members" 
              :key="m.id" 
              :label="`${m.name} (${m.phone})`" 
              :value="m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="pointsForm.type">
            <el-radio value="earn">增加积分</el-radio>
            <el-radio value="spend">扣减积分</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分数量">
          <el-input-number v-model="pointsForm.amount" :min="1" :max="100000" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="pointsForm.remark" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPoints = false">取消</el-button>
        <el-button type="primary" @click="submitPoints">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExchange" title="会员兑换" width="600px">
      <div v-if="selectedMember">
        <el-alert 
          :title="`${selectedMember.name} 当前可用积分: ${selectedMember.availablePoints.toLocaleString()}`" 
          type="info" 
          :closable="false"
          style="margin-bottom: 20px;"
        />
        <el-table :data="onShelfProducts" size="small">
          <el-table-column label="商品">
            <template #default="{ row }">
              <span>{{ row.imageUrl }} {{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pointsRequired" label="所需积分" width="100" />
          <el-table-column prop="availableStock" label="库存" width="80" />
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.quantity" 
                :min="1" 
                :max="Math.min(row.availableStock, Math.floor(selectedMember.availablePoints / row.pointsRequired))" 
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                :disabled="row.pointsRequired * (row.quantity || 1) > selectedMember.availablePoints"
                @click="confirmExchange(row)"
              >
                兑换
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore, useMemberStore, useProductStore, useOrderStore } from '@/stores'
import type { Member, Product } from '@/types'

const authStore = useAuthStore()
const memberStore = useMemberStore()
const productStore = useProductStore()
const orderStore = useOrderStore()

const members = computed(() => memberStore.members)
const onShelfProducts = computed(() => 
  productStore.onShelfProducts.map(p => ({ ...p, quantity: 1 }))
)

const showDetail = ref(false)
const showAddPoints = ref(false)
const showExchange = ref(false)
const selectedMember = ref<Member | null>(null)

const memberPointsRecords = computed(() => {
  if (!selectedMember.value) return []
  return memberStore.getMemberPointsRecords(selectedMember.value.id)
})

const pointsForm = ref({
  memberId: '',
  type: 'earn' as 'earn' | 'spend',
  amount: 100,
  remark: ''
})

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    '普通': '#909399',
    '银卡': '#909399',
    '金卡': '#e6a23c',
    '钻石': '#667eea'
  }
  return colors[level] || '#909399'
}

const getLevelType = (level: string) => {
  const types: Record<string, any> = {
    '普通': 'info',
    '银卡': 'info',
    '金卡': 'warning',
    '钻石': 'success'
  }
  return types[level] || 'info'
}

const viewDetail = (member: Member) => {
  selectedMember.value = member
  showDetail.value = true
}

const handleExchange = (member: Member) => {
  selectedMember.value = member
  showExchange.value = true
}

const submitPoints = () => {
  if (!pointsForm.value.memberId || !pointsForm.value.remark) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const member = memberStore.getMemberById(pointsForm.value.memberId)
  if (!member) return

  const amount = pointsForm.value.type === 'earn' 
    ? pointsForm.value.amount 
    : -pointsForm.value.amount

  if (pointsForm.value.type === 'spend' && member.availablePoints < pointsForm.value.amount) {
    ElMessage.error('可用积分不足')
    return
  }

  memberStore.addPoints(
    pointsForm.value.memberId,
    amount,
    'adjust',
    pointsForm.value.remark,
    authStore.currentUser!
  )

  ElMessage.success('积分调整成功')
  showAddPoints.value = false
  pointsForm.value = { memberId: '', type: 'earn', amount: 100, remark: '' }
}

const confirmExchange = (product: Product & { quantity: number }) => {
  if (!selectedMember.value || !authStore.currentUser) return

  const result = orderStore.createOrder(
    selectedMember.value,
    product,
    product.quantity || 1,
    authStore.currentUser
  )

  if (result.success && result.order) {
    ElMessage.success(`兑换申请已提交，订单号: ${result.order.orderNo}，积分已冻结`)
    showExchange.value = false
  } else {
    ElMessage.error(result.message || '兑换申请失败')
  }
}
</script>

<style scoped>
.members-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.points-info .available {
  font-size: 14px;
}

.points-info .frozen {
  font-size: 12px;
  color: #999;
}

.member-detail h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
