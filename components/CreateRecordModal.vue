<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">新建记录</h2>
        <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-4">
          <div class="flex gap-4">
            <button
              v-for="t in ['restock', 'loss']"
              :key="t"
              @click="form.type = t"
              class="flex-1 py-3 px-4 rounded-xl border-2 transition-all text-center"
              :class="form.type === t 
                ? (t === 'restock' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-orange-500 bg-orange-50 text-orange-700')
                : 'border-gray-200 hover:border-gray-300'"
            >
              <Icon :name="t === 'restock' ? 'lucide:package' : 'lucide:trash-2'" class="w-5 h-5 mx-auto mb-1" />
              <span class="font-medium">{{ t === 'restock' ? '补货' : '损耗' }}</span>
            </button>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择商品</label>
            <select v-model="form.productId" class="input">
              <option value="">请选择商品</option>
              <option v-for="p in store.products" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.sku }}) - 库存: {{ p.currentStock }}{{ p.unit }}
              </option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">数量</label>
              <input v-model.number="form.quantity" type="number" min="1" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select v-model="form.priority" class="input">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">位置</label>
            <select v-model="form.location" class="input">
              <option value="主馆文创区">主馆文创区</option>
              <option value="分馆文创角">分馆文创角</option>
              <option value="特展文创区">特展文创区</option>
              <option value="活动现场">活动现场</option>
              <option value="教育活动区">教育活动区</option>
            </select>
          </div>
          
          <div v-if="form.type === 'restock'">
            <label class="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <select v-model="form.supplier" class="input">
              <option value="">请选择供应商</option>
              <option value="文创优品供应商">文创优品供应商</option>
              <option value="智趣玩具商行">智趣玩具商行</option>
              <option value="文博文具">文博文具</option>
              <option value="艺术生活家居">艺术生活家居</option>
            </select>
          </div>
          
          <div v-if="form.type === 'restock'">
            <label class="block text-sm font-medium text-gray-700 mb-1">预计到货日期</label>
            <input v-model="form.expectedDate" type="date" class="input" />
          </div>
          
          <div v-if="form.type === 'loss'">
            <label class="block text-sm font-medium text-gray-700 mb-1">损耗原因</label>
            <select v-model="form.lossReason" class="input">
              <option value="">请选择原因</option>
              <option value="顾客损坏">顾客损坏</option>
              <option value="活动赠礼">活动赠礼</option>
              <option value="活动消耗">活动消耗</option>
              <option value="自然损耗">自然损耗</option>
              <option value="丢失">丢失</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联活动（可选）</label>
            <input v-model="form.relatedEvent" type="text" placeholder="如：五一特别展览" class="input" />
          </div>
          
          <div v-if="form.type === 'loss'">
            <label class="block text-sm font-medium text-gray-700 mb-1">关联订单（可选）</label>
            <input v-model="form.relatedTicketOrder" type="text" placeholder="如：TK2024052300127" class="input" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="form.remark" rows="3" class="input resize-none" placeholder="请输入详细说明..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-100 flex gap-3">
        <button @click="$emit('close')" class="flex-1 btn btn-secondary">
          取消
        </button>
        <button @click="handleSubmit" :disabled="!isFormValid" class="flex-1 btn btn-primary">
          提交
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import type { RecordType, InventoryRecord } from '~/types'

const store = useMuseumStore()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const form = reactive({
  type: 'restock' as RecordType,
  productId: '',
  quantity: 1,
  priority: 'medium' as 'low' | 'medium' | 'high',
  location: '主馆文创区',
  supplier: '',
  expectedDate: '',
  lossReason: '',
  relatedEvent: '',
  relatedTicketOrder: '',
  remark: ''
})

const isFormValid = computed(() => {
  return form.productId && form.quantity > 0
})

const handleSubmit = () => {
  if (!isFormValid.value) return
  
  const product = store.products.find(p => p.id === form.productId)
  if (!product) return
  
  const newRecord: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'createdBy' | 'createdByName'> = {
    type: form.type,
    productId: form.productId,
    productName: product.name,
    productSku: product.sku,
    quantity: form.quantity,
    status: 'pending',
    priority: form.priority,
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: form.location,
    remark: form.remark,
    ...(form.type === 'restock' && {
      supplier: form.supplier,
      expectedDate: form.expectedDate
    }),
    ...(form.type === 'loss' && {
      lossReason: form.lossReason,
      relatedTicketOrder: form.relatedTicketOrder || undefined
    }),
    ...(form.relatedEvent && {
      relatedEvent: form.relatedEvent
    })
  }
  
  store.createRecord(newRecord)
  
  store.addNotification({
    title: `新${form.type === 'restock' ? '补货' : '损耗'}申请`,
    content: `${product.name} ${form.type === 'restock' ? '补货' : '损耗'}${form.quantity}${product.unit}，等待审批`,
    type: 'info',
    priority: form.priority
  })
  
  if (form.relatedEvent && form.expectedDate) {
    store.addCalendarEvent({
      date: form.expectedDate,
      type: form.type === 'restock' ? 'restock' : 'loss',
      title: `${product.name} ${form.type === 'restock' ? '补货到货' : '损耗记录'}`,
      description: form.remark,
      status: 'pending'
    })
  }
  
  emit('close')
}
</script>
