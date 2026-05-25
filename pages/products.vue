<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">商品库存</h1>
        <p class="text-sm text-gray-500 mt-1">查看和管理文创商品库存</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">商品总数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ store.products.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">库存预警</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ store.lowStockProducts.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">总库存价值</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">¥{{ totalValue.toLocaleString() }}</p>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">商品</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">分类</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">当前库存</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">最低库存</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">单价</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="product in store.products" :key="product.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ product.name }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-500 font-mono">{{ product.sku }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600">{{ product.category }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="font-medium" :class="product.currentStock < product.minStock ? 'text-red-600' : 'text-gray-900'">
                  {{ product.currentStock }}{{ product.unit }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm text-gray-500">{{ product.minStock }}{{ product.unit }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm text-gray-900">¥{{ product.price }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span 
                  v-if="product.currentStock < product.minStock" 
                  class="inline-flex items-center gap-1 text-xs text-red-600"
                >
                  <Icon name="lucide:alert-triangle" class="w-3 h-3" />
                  库存不足
                </span>
                <span v-else class="text-xs text-green-600">正常</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'

const store = useMuseumStore()

const totalValue = computed(() => {
  return store.products.reduce((sum, p) => sum + p.currentStock * p.price, 0)
})
</script>
