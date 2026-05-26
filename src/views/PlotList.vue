<template>
  <div class="plot-list">
    <div class="flex-between mb-20">
      <h1 class="page-title">地块管理</h1>
      <button v-if="currentUser.role !== 'operator'" class="btn btn-primary" @click="showAddModal = true">
        + 新增地块
      </button>
    </div>
    
    <div class="card">
      <div class="filter-bar">
        <select v-model="filterStatus" class="form-select" style="width: 120px">
          <option value="">全部状态</option>
          <option value="pending">待执行</option>
          <option value="progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="delayed">已延误</option>
        </select>
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="form-input" 
          placeholder="搜索地块名称、农户..."
          style="width: 240px"
        />
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>地块名称</th>
            <th>面积(亩)</th>
            <th>位置</th>
            <th>农户</th>
            <th>作物</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plot in filteredPlots" :key="plot.id" @click="goToDetail(plot.id)">
            <td>{{ plot.name }}</td>
            <td>{{ plot.area }}</td>
            <td>{{ plot.location }}</td>
            <td>{{ plot.farmer }}</td>
            <td>{{ plot.crop }}</td>
            <td>
              <span :class="['status-tag', `status-${plot.status}`]">
                {{ getStatusText(plot.status) }}
              </span>
            </td>
            <td>{{ plot.createTime }}</td>
            <td>
              <button class="btn btn-default btn-sm" @click.stop="goToDetail(plot.id)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredPlots.length === 0" class="empty-state">
        暂无地块数据
      </div>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增地块</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">地块名称</label>
            <input v-model="newPlot.name" type="text" class="form-input" placeholder="请输入地块名称" />
          </div>
          <div class="form-item">
            <label class="form-label">面积(亩)</label>
            <input v-model.number="newPlot.area" type="number" class="form-input" placeholder="请输入面积" />
          </div>
          <div class="form-item">
            <label class="form-label">位置</label>
            <input v-model="newPlot.location" type="text" class="form-input" placeholder="请输入位置" />
          </div>
          <div class="form-item">
            <label class="form-label">农户姓名</label>
            <input v-model="newPlot.farmer" type="text" class="form-input" placeholder="请输入农户姓名" />
          </div>
          <div class="form-item">
            <label class="form-label">联系电话</label>
            <input v-model="newPlot.phone" type="text" class="form-input" placeholder="请输入联系电话" />
          </div>
          <div class="form-item">
            <label class="form-label">作物类型</label>
            <select v-model="newPlot.crop" class="form-select">
              <option value="小麦">小麦</option>
              <option value="玉米">玉米</option>
              <option value="水稻">水稻</option>
              <option value="大豆">大豆</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddPlot">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePlotStore } from '../stores/plot'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const plotStore = usePlotStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const filterStatus = ref('')
const searchKeyword = ref('')
const showAddModal = ref(false)

const newPlot = ref({
  name: '',
  area: 0,
  location: '',
  farmer: '',
  phone: '',
  crop: '小麦'
})

const filteredPlots = computed(() => {
  let plots = [...plotStore.plots]
  
  if (filterStatus.value) {
    plots = plots.filter(p => p.status === filterStatus.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    plots = plots.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.farmer.toLowerCase().includes(keyword)
    )
  }
  
  return plots
})

function getStatusText(status) {
  const map = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
  return map[status] || status
}

function goToDetail(id) {
  router.push(`/plots/${id}`)
}

async function handleAddPlot() {
  if (!newPlot.value.name || !newPlot.value.area) {
    toastStore.error('请填写完整信息')
    return
  }
  
  await plotStore.addPlot({ ...newPlot.value })
  toastStore.success('添加成功')
  showAddModal.value = false
  newPlot.value = { name: '', area: 0, location: '', farmer: '', phone: '', crop: '小麦' }
}

onMounted(async () => {
  await plotStore.loadPlots()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.table tbody tr {
  cursor: pointer;
}

.table tbody tr:hover {
  background: #f5f7fa;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
