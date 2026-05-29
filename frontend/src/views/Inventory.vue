<template>
  <div class="inventory-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>库存管理</span>
          <el-input v-model="keyword" placeholder="搜索配件名称/编码" style="width: 250px" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部库存" name="all">
          <el-table :data="filteredParts" v-loading="loading">
            <el-table-column prop="part_code" label="配件编码" width="120" />
            <el-table-column prop="name" label="配件名称" min-width="180" />
            <el-table-column prop="brand" label="品牌" width="100" />
            <el-table-column prop="category_display" label="分类" width="100" />
            <el-table-column prop="spec" label="规格" width="150" />
            <el-table-column prop="stock_qty" label="库存" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.stock_qty < 10 ? 'danger' : row.stock_qty < 30 ? 'warning' : 'success'" size="small">
                  {{ row.stock_qty }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="cost_price" label="成本价" width="100" align="right">
              <template #default="{ row }">¥{{ row.cost_price }}</template>
            </el-table-column>
            <el-table-column prop="sale_price" label="销售价" width="100" align="right">
              <template #default="{ row }">¥{{ row.sale_price }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="库存预警" name="warning">
          <el-table :data="warningParts" v-loading="loading">
            <el-table-column prop="part_code" label="配件编码" width="120" />
            <el-table-column prop="name" label="配件名称" min-width="180" />
            <el-table-column prop="brand" label="品牌" width="100" />
            <el-table-column prop="spec" label="规格" width="150" />
            <el-table-column prop="stock_qty" label="库存" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.stock_qty }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="建议" width="150">
              <template #default="{ row }">
                <span style="color: #f56c6c;">建议补货 {{ Math.max(0, 20 - row.stock_qty) }} 件</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getParts } from '../api/endpoints'
import { Search } from '@element-plus/icons-vue'

const parts = ref([])
const loading = ref(false)
const keyword = ref('')
const activeTab = ref('all')

const warningParts = computed(() => parts.value.filter(p => p.stock_qty < 10))
const filteredParts = computed(() => {
  if (!keyword.value) return parts.value
  const kw = keyword.value.toLowerCase()
  return parts.value.filter(p => 
    p.name.toLowerCase().includes(kw) || 
    p.part_code.toLowerCase().includes(kw) ||
    p.model?.toLowerCase().includes(kw)
  )
})

const loadParts = async () => {
  loading.value = true
  parts.value = await getParts()
  loading.value = false
}

onMounted(() => {
  loadParts()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
