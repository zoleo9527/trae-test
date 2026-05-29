<template>
  <div class="inventory-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon blue">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalStock }}</div>
            <div class="stat-label">总库存</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon orange">🔒</div>
          <div class="stat-content">
            <div class="stat-value">{{ lockedStock }}</div>
            <div class="stat-label">锁定库存</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card warning">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ lowStockCount }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>📦 待发货订单</span>
          <el-badge :value="pendingShipCount" type="warning" />
        </div>
      </template>
      
      <el-table :data="pendingShipOrders">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="商品" width="200">
          <template #default="{ row }">
            {{ row.productImage }} {{ row.productName }}
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="storeName" label="配送门店" width="120" />
        <el-table-column prop="confirmTime" label="确认时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="shipOrder(row)">
              确认发货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="pendingShipOrders.length === 0" description="暂无待发货订单" :image-size="100" />
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>🔄 库存调整</span>
          <el-button type="primary" @click="showAdjustDialog = true">
            <el-icon><Plus /></el-icon>
            库存调整
          </el-button>
        </div>
      </template>
      
      <el-table :data="inventoryLogs.slice(0, 10)">
        <el-table-column prop="createTime" label="时间" width="160" />
        <el-table-column prop="productName" label="商品" width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : row.type === 'out' ? 'danger' : 'info'" size="small">
              {{ row.type === 'in' ? '入库' : row.type === 'out' ? '出库' : row.type === 'lock' ? '锁定' : '调整' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'in' ? '#67c23a' : '#f56c6c' }">
              {{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeStock" label="变动前" width="100" />
        <el-table-column prop="afterStock" label="变动后" width="100" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="operatorName" label="操作人" width="100" />
      </el-table>
    </el-card>

    <el-dialog v-model="showAdjustDialog" title="库存调整" width="500px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="选择商品">
          <el-select v-model="adjustForm.productId" placeholder="请选择商品" filterable>
            <el-option 
              v-for="p in products" 
              :key="p.id" 
              :label="p.name" 
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.type">
            <el-radio value="in">入库</el-radio>
            <el-radio value="out">出库</el-radio>
            <el-radio value="adjust">盘点调整</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="adjustForm.quantity" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdjustDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore, useProductStore, useOrderStore } from '@/stores'

const authStore = useAuthStore()
const productStore = useProductStore()
const orderStore = useOrderStore()

const products = computed(() => productStore.products)
const inventoryLogs = computed(() => productStore.inventoryLogs)

const totalStock = computed(() => 
  products.value.reduce((sum, p) => sum + p.stock, 0)
)
const lockedStock = computed(() => 
  products.value.reduce((sum, p) => sum + p.lockedStock, 0)
)
const lowStockCount = computed(() => 
  products.value.filter(p => p.availableStock < 10).length
)

const pendingShipOrders = computed(() => 
  orderStore.orders.filter(o => o.status === 'confirmed')
)
const pendingShipCount = computed(() => pendingShipOrders.value.length)

const showAdjustDialog = ref(false)
const adjustForm = ref({
  productId: '',
  type: 'in' as 'in' | 'out' | 'adjust',
  quantity: 10,
  remark: ''
})

const shipOrder = (order: any) => {
  if (!authStore.currentUser) return
  
  if (order.isAbnormal) {
    ElMessage.error('该订单存在异常，请先由企划专员解除异常')
    return
  }
  
  const result = orderStore.shipOrder(order.id, authStore.currentUser)
  if (result.success) {
    ElMessage.success('已发货，库存已扣减')
  } else {
    ElMessage.error(result.message || '发货失败')
  }
}

const submitAdjust = () => {
  if (!adjustForm.value.productId || !adjustForm.value.remark) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const product = productStore.getProductById(adjustForm.value.productId)
  if (!product) return
  
  if (adjustForm.value.type === 'out' && product.availableStock < adjustForm.value.quantity) {
    ElMessage.error('库存不足')
    return
  }
  
  if (authStore.currentUser) {
    productStore.adjustStock(
      adjustForm.value.productId,
      adjustForm.value.quantity,
      adjustForm.value.type,
      adjustForm.value.remark,
      authStore.currentUser
    )
    
    ElMessage.success('库存调整成功')
    showAdjustDialog.value = false
    adjustForm.value = { productId: '', type: 'in', quantity: 10, remark: '' }
  }
}
</script>

<style scoped>
.inventory-page {
  display: flex;
  flex-direction: column;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  border: 1px solid #fef0f0;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  float: left;
  margin-right: 15px;
}

.stat-icon.blue { background: #ecf5ff; }
.stat-icon.orange { background: #fdf6ec; }
.stat-icon.red { background: #fef0f0; }

.stat-content { overflow: hidden; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-top: 5px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}
</style>
