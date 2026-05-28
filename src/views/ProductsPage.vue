<template>
  <div class="products-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ products.length }}</div>
            <div class="stat-label">商品总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">🏷️</div>
          <div class="stat-content">
            <div class="stat-value">{{ onShelfCount }}</div>
            <div class="stat-label">已上架</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">🤝</div>
          <div class="stat-content">
            <div class="stat-value">{{ coBrandedCount }}</div>
            <div class="stat-label">联名商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning" @click="filterSyncFailed">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ syncFailedCount }}</div>
            <div class="stat-label">同步异常</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>📦 商品管理</span>
          <div class="header-actions">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索商品" 
              style="width: 200px; margin-right: 10px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px; margin-right: 10px;">
              <el-option label="已上架" value="on_shelf" />
              <el-option label="待上架" value="pending" />
              <el-option label="同步异常" value="sync_failed" />
            </el-select>
            <el-button v-if="isPlanner" type="primary">
              <el-icon><Plus /></el-icon>
              新增商品
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredProducts">
        <el-table-column label="商品" width="250">
          <template #default="{ row }">
            <div class="product-info">
              <span class="product-image">{{ row.imageUrl }}</span>
              <div class="product-detail">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-code">{{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="pointsRequired" label="所需积分" width="100" />
        <el-table-column label="库存" width="150">
          <template #default="{ row }">
            <div class="stock-info">
              <span>可用: <strong :class="{ low: row.availableStock < 10 }">{{ row.availableStock }}</strong></span>
              <span class="locked">锁定: {{ row.lockedStock }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联名商品" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.isCoBranded" type="warning" size="small">
              {{ row.coBrandPartner }}
            </el-tag>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="同步状态" width="120">
          <template #default="{ row }">
            <template v-if="row.isCoBranded">
              <el-tag 
                size="small"
                :type="row.syncStatus === 'synced' ? 'success' : row.syncStatus === 'pending' ? 'warning' : 'danger'"
              >
                {{ row.syncStatus === 'synced' ? '已同步' : row.syncStatus === 'pending' ? '同步中' : '同步失败' }}
              </el-tag>
            </template>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.syncStatus === 'failed'" type="danger" size="small" link @click="retrySync(row)">
              重试同步
            </el-button>
            <template v-if="isPlanner">
              <el-button v-if="row.status === 'pending'" type="primary" size="small" link @click="handleOnShelf(row)">
                上架
              </el-button>
              <el-button v-else-if="row.status === 'on_shelf'" type="warning" size="small" link @click="handleOffShelf(row)">
                下架
              </el-button>
            </template>
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDetail" title="商品详情" width="600px">
      <div v-if="selectedProduct" class="product-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称" :span="2">{{ selectedProduct.name }}</el-descriptions-item>
          <el-descriptions-item label="商品编码">{{ selectedProduct.code }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ selectedProduct.category }}</el-descriptions-item>
          <el-descriptions-item label="所需积分">{{ selectedProduct.pointsRequired }}</el-descriptions-item>
          <el-descriptions-item label="联名商品">
            <el-tag v-if="selectedProduct.isCoBranded" type="warning">
              {{ selectedProduct.coBrandPartner }}
            </el-tag>
            <span v-else>否</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedProduct.status)">
              {{ getStatusLabel(selectedProduct.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总库存" :span="2">{{ selectedProduct.stock }}</el-descriptions-item>
          <el-descriptions-item label="可用库存">{{ selectedProduct.availableStock }}</el-descriptions-item>
          <el-descriptions-item label="锁定库存">{{ selectedProduct.lockedStock }}</el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">{{ selectedProduct.description }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />
        
        <h4>库存变动记录</h4>
        <el-table :data="inventoryLogs" size="small">
          <el-table-column prop="createTime" label="时间" width="160" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'in' ? 'success' : row.type === 'out' ? 'danger' : 'info'" size="small">
                {{ row.type === 'in' ? '入库' : row.type === 'out' ? '出库' : row.type === 'lock' ? '锁定' : '调整' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'in' ? '#67c23a' : '#f56c6c' }">
                {{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="beforeStock" label="变动前" width="80" />
          <el-table-column prop="afterStock" label="变动后" width="80" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAuthStore, useProductStore } from '@/stores'
import { ProductStatusLabels, ProductStatus, type Product } from '@/types'

const authStore = useAuthStore()
const productStore = useProductStore()

const products = computed(() => productStore.products)
const onShelfCount = computed(() => products.value.filter(p => p.status === ProductStatus.ON_SHELF).length)
const coBrandedCount = computed(() => products.value.filter(p => p.isCoBranded).length)
const syncFailedCount = computed(() => products.value.filter(p => p.syncStatus === 'failed').length)

const isPlanner = computed(() => authStore.isPlanner)

const searchKeyword = ref('')
const filterStatus = ref('')
const showDetail = ref(false)
const selectedProduct = ref<Product | null>(null)

const filteredProducts = computed(() => {
  let list = products.value
  
  if (searchKeyword.value) {
    list = list.filter(p => 
      p.name.includes(searchKeyword.value) || 
      p.code.includes(searchKeyword.value)
    )
  }
  
  if (filterStatus.value) {
    if (filterStatus.value === 'sync_failed') {
      list = list.filter(p => p.syncStatus === 'failed')
    } else {
      list = list.filter(p => p.status === filterStatus.value)
    }
  }
  
  return list
})

const inventoryLogs = computed(() => {
  if (!selectedProduct.value) return []
  return productStore.inventoryLogs.filter(l => l.productId === selectedProduct.value?.id)
})

const getStatusLabel = (status: string) => {
  return ProductStatusLabels[status as keyof typeof ProductStatusLabels] || status
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'draft': 'info',
    'pending': 'warning',
    'on_shelf': 'success',
    'off_shelf': 'info',
    'syncing': 'primary'
  }
  return types[status] || 'info'
}

const filterSyncFailed = () => {
  filterStatus.value = 'sync_failed'
}

const retrySync = (product: Product) => {
  ElMessage.info(`正在重试同步 ${product.name}...`)
  setTimeout(() => {
    const p = productStore.products.find(item => item.id === product.id)
    if (p) {
      p.syncStatus = 'synced'
      p.lastSyncTime = new Date().toLocaleString()
      ElMessage.success(`${product.name} 同步成功`)
    }
  }, 1500)
}

const handleOnShelf = (product: Product) => {
  productStore.updateProductStatus(product.id, ProductStatus.ON_SHELF)
  ElMessage.success(`${product.name} 已上架`)
}

const handleOffShelf = (product: Product) => {
  productStore.updateProductStatus(product.id, ProductStatus.OFF_SHELF)
  ElMessage.success(`${product.name} 已下架`)
}

const viewDetail = (product: Product) => {
  selectedProduct.value = product
  showDetail.value = true
}
</script>

<style scoped>
.products-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
.stat-icon.green { background: #f0f9eb; }
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
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  font-size: 36px;
}

.product-detail {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
  color: #333;
}

.product-code {
  font-size: 12px;
  color: #999;
  margin-top: 3px;
}

.stock-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stock-info .low {
  color: #f56c6c;
}

.stock-info .locked {
  font-size: 12px;
  color: #999;
}

.product-detail h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
