<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-select v-model="filterCategory" placeholder="物资分类" clearable style="width: 150px">
          <el-option label="服装" value="服装" />
          <el-option label="住宿" value="住宿" />
          <el-option label="生活用品" value="生活用品" />
          <el-option label="防护" value="防护" />
          <el-option label="医疗" value="医疗" />
          <el-option label="文具" value="文具" />
        </el-select>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <el-card
        v-for="material in filteredMaterials"
        :key="material.id"
        shadow="hover"
        class="material-card"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">{{ material.name }}</h3>
            <el-tag size="small" class="mt-1">{{ material.category }}</el-tag>
          </div>
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="getStockBgClass(material.stockQuantity)"
          >
            <component :is="icons.Package" class="w-5 h-5" :class="getStockTextClass(material.stockQuantity)" />
          </div>
        </div>

        <div class="mt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">库存数量</span>
            <span class="font-medium" :class="getStockTextClass(material.stockQuantity)">
              {{ material.stockQuantity }} {{ material.unit }}
            </span>
          </div>
          <div class="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="getStockBarClass(material.stockQuantity)"
              :style="{ width: Math.min(material.stockQuantity * 2, 100) + '%' }"
            />
          </div>
        </div>

        <div class="mt-3 text-sm text-gray-500">
          {{ material.specification }}
        </div>

        <div class="mt-4 flex gap-2">
          <el-button size="small" @click="showDistributeDialog(material)">发放</el-button>
          <el-button size="small" type="primary" @click="showRestockDialog(material)">补货</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showDistribute" title="物资发放" width="500px">
      <el-form :model="distributeForm" label-width="100px">
        <el-form-item label="物资名称">
          <el-input :value="selectedMaterial?.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="`${selectedMaterial?.stockQuantity} ${selectedMaterial?.unit}`" disabled />
        </el-form-item>
        <el-form-item label="营员">
          <el-select v-model="distributeForm.camperId" placeholder="选择营员" style="width: 100%">
            <el-option
              v-for="camper in campers"
              :key="camper.id"
              :label="camper.name"
              :value="camper.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发放数量">
          <el-input-number v-model="distributeForm.quantity" :min="1" :max="selectedMaterial?.stockQuantity || 1" />
        </el-form-item>
        <el-form-item label="发放人">
          <el-input v-model="distributeForm.distributedBy" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="distributeForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDistribute = false">取消</el-button>
        <el-button type="primary" @click="confirmDistribute">确认发放</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRestock" title="物资补货" width="400px">
      <el-form label-width="100px">
        <el-form-item label="物资名称">
          <el-input :value="selectedMaterial?.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="selectedMaterial?.stockQuantity" disabled />
        </el-form-item>
        <el-form-item label="补货数量">
          <el-input-number v-model="restockQuantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRestock = false">取消</el-button>
        <el-button type="primary" @click="confirmRestock">确认补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { materialApi, camperApi } from '@/api'
import * as icons from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const materials = ref<any[]>([])
const campers = ref<any[]>([])
const filterCategory = ref('')
const showDistribute = ref(false)
const showRestock = ref(false)
const selectedMaterial = ref<any>(null)
const distributeForm = ref<any>({
  camperId: '',
  quantity: 1,
  distributedBy: '',
  remark: '',
})
const restockQuantity = ref(10)

const filteredMaterials = computed(() => {
  if (!filterCategory.value) return materials.value
  return materials.value.filter((m) => m.category === filterCategory.value)
})

const getStockBgClass = (qty: number) => {
  if (qty < 10) return 'bg-red-100'
  if (qty < 30) return 'bg-yellow-100'
  return 'bg-green-100'
}

const getStockTextClass = (qty: number) => {
  if (qty < 10) return 'text-red-600'
  if (qty < 30) return 'text-yellow-600'
  return 'text-green-600'
}

const getStockBarClass = (qty: number) => {
  if (qty < 10) return 'bg-red-500'
  if (qty < 30) return 'bg-yellow-500'
  return 'bg-green-500'
}

const loadData = async () => {
  try {
    materials.value = await materialApi.getList()
    campers.value = await camperApi.getList()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const showDistributeDialog = (material: any) => {
  selectedMaterial.value = material
  distributeForm.value = {
    materialId: material.id,
    camperId: '',
    quantity: 1,
    distributedBy: '',
    remark: '',
  }
  showDistribute.value = true
}

const showRestockDialog = (material: any) => {
  selectedMaterial.value = material
  restockQuantity.value = 10
  showRestock.value = true
}

const confirmDistribute = async () => {
  try {
    await materialApi.distribute({
      ...distributeForm.value,
      materialId: selectedMaterial.value.id,
    })
    ElMessage.success('发放成功')
    showDistribute.value = false
    loadData()
  } catch (e: any) {
    const msg = e?.response?.data?.message || '发放失败'
    ElMessage.error(msg)
  }
}

const confirmRestock = async () => {
  try {
    await materialApi.restock(selectedMaterial.value.id, restockQuantity.value)
    ElMessage.success('补货成功')
    showRestock.value = false
    loadData()
  } catch (e) {
    ElMessage.error('补货失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.material-card {
  transition: all 0.2s;
}
.material-card:hover {
  transform: translateY(-2px);
}
</style>
