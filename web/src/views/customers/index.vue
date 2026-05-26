<template>
  <div class="page-container">
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索客户名/电话" clearable style="width: 240px;" @input="loadData" />
      </div>

      <el-table :data="list" stripe>
        <el-table-column prop="name" label="客户姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="community" label="所在小区" width="140" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column label="订单数" width="80">
          <template #default="{ row }">{{ row.orders?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewCustomer(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="新增客户" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="所在小区">
          <el-input v-model="form.community" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createCustomer">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { customerApi } from '@/api'
import { formatDateTime } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const keyword = ref('')
const showCreateDialog = ref(false)
const form = ref({
  name: '',
  phone: '',
  address: '',
  community: '',
  remark: '',
})

async function loadData() {
  const params: any = { pageSize: 100 }
  if (keyword.value) params.keyword = keyword.value
  const res = await customerApi.getList(params)
  list.value = res.items || []
}

async function createCustomer() {
  await customerApi.create(form.value)
  ElMessage.success('创建成功')
  showCreateDialog.value = false
  loadData()
}

function viewCustomer(customer: any) {
  ElMessage.info('客户详情功能开发中')
}

onMounted(() => loadData())
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; }
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
