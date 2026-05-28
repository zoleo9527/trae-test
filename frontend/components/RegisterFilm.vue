<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">胶卷登记</h2>
      <p class="text-gray-500">登记新的胶卷冲扫订单</p>
    </div>
    
    <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
      <p class="text-green-700 font-medium">登记成功！单号：{{ newRegNumber }}</p>
      <button @click="resetForm" class="mt-2 text-sm text-green-600 hover:text-green-800">继续登记</button>
    </div>
    
    <form @submit.prevent="submitForm" class="bg-white rounded-xl shadow-sm p-6">
      <div class="grid grid-cols-2 gap-6">
        <div class="col-span-2">
          <h3 class="text-lg font-medium text-gray-800 mb-4">客户信息</h3>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
          <input
            v-model="form.customer_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="请输入客户姓名"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
          <input
            v-model="form.customer_phone"
            type="tel"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="请输入联系电话"
          />
        </div>
        
        <div class="col-span-2 mt-4">
          <h3 class="text-lg font-medium text-gray-800 mb-4">胶卷信息</h3>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">胶卷类型 *</label>
          <select
            v-model="form.film_type"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            <option value="135彩色负片">135彩色负片</option>
            <option value="135黑白">135黑白</option>
            <option value="135反转片">135反转片</option>
            <option value="120彩色负片">120彩色负片</option>
            <option value="120黑白">120黑白</option>
            <option value="120反转片">120反转片</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">胶卷品牌 *</label>
          <input
            v-model="form.film_brand"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="如：柯达 Gold 200"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ISO *</label>
          <input
            v-model.number="form.iso"
            type="number"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="100 / 200 / 400"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">张数 *</label>
          <select
            v-model.number="form.frame_count"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option :value="12">12张（120）</option>
            <option :value="16">16张（120）</option>
            <option :value="24">24张（135）</option>
            <option :value="36">36张（135）</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">冲洗工艺 *</label>
          <select
            v-model="form.development_type"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            <option value="标准C-41">标准C-41（彩色负片）</option>
            <option value="D-76 原液">D-76 原液（黑白）</option>
            <option value="D-76 1:1">D-76 1:1（黑白）</option>
            <option value="E-6">E-6（反转片）</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">扫描分辨率 *</label>
          <select
            v-model="form.scan_resolution"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="2K">2K（基础）</option>
            <option value="4K">4K（标准）</option>
            <option value="8K">8K（高清）</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select
            v-model="form.priority"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="normal">普通</option>
            <option value="high">高优先级</option>
            <option value="urgent">加急</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">特殊要求</label>
          <input
            v-model="form.special_instructions"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="迫冲、留片边等"
          />
        </div>
        
        <div class="col-span-2 mt-4">
          <h3 class="text-lg font-medium text-gray-800 mb-4">费用信息</h3>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">金额（元）*</label>
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        
        <div class="flex items-center pt-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.paid"
              type="checkbox"
              class="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
            />
            <span class="text-sm text-gray-700">已付款</span>
          </label>
        </div>
        
        <div class="col-span-2 mt-6">
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {{ loading ? '登记中...' : '确认登记' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { token } = useAuth()
const config = useRuntimeConfig()

const loading = ref(false)
const success = ref(false)
const newRegNumber = ref('')

const form = ref({
  customer_name: '',
  customer_phone: '',
  film_type: '',
  film_brand: '',
  iso: 200,
  frame_count: 36,
  development_type: '',
  scan_resolution: '4K',
  special_instructions: '',
  priority: 'normal',
  amount: 0,
  paid: false
})

const submitForm = async () => {
  loading.value = true
  
  try {
    const result: any = await $fetch(`${config.public.apiBase}/api/film-rolls`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: form.value
    })
    
    newRegNumber.value = result.registration_number
    success.value = true
  } catch (e) {
    console.error('登记失败', e)
    alert('登记失败，请重试')
  }
  
  loading.value = false
}

const resetForm = () => {
  success.value = false
  form.value = {
    customer_name: '',
    customer_phone: '',
    film_type: '',
    film_brand: '',
    iso: 200,
    frame_count: 36,
    development_type: '',
    scan_resolution: '4K',
    special_instructions: '',
    priority: 'normal',
    amount: 0,
    paid: false
  }
}
</script>
