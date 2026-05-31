<template>
  <div v-if="equipment" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateTo('/equipment')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ equipment.name }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm text-gray-500">{{ equipment.equipmentNo }}</span>
            <span :class="getStatusBadgeClass(equipment.status)">
              {{ equipmentStore.getStatusLabel(equipment.status) }}
            </span>
            <span :class="getConditionBadgeClass(equipment.condition)">
              {{ equipmentStore.getConditionLabel(equipment.condition) }}
            </span>
            <span v-if="isOverdue" class="badge bg-red-100 text-red-800 animate-pulse">
              已逾期
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="equipment.status === 'borrowed' && userStore.hasPermission('equipment:return')"
          class="btn btn-primary"
          @click="showReturnModal = true"
        >
          归还验收
        </button>
        <button
          v-if="equipment.status === 'available' && userStore.hasPermission('equipment:lend')"
          class="btn btn-primary"
          @click="showLendModal = true"
        >
          登记借出
        </button>
        <button
          v-if="userStore.hasPermission('equipment:maintenance')"
          class="btn btn-outline"
          @click="showMaintenanceModal = true"
        >
          安排维修
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">租借费</p>
        <p class="text-2xl font-bold text-primary-600 mt-1">¥{{ equipment.rentalFee }}/次</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">押金</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">¥{{ equipment.deposit }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">累计租借</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ equipment.borrowHistory.length }} 次</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">维修记录</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ equipment.maintenanceRecords.length }} 次</p>
      </div>
    </div>

    <div v-if="isOverdue && activeBorrow" class="card bg-red-50 border-red-200">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <p class="font-medium text-red-900">逾期提醒</p>
          <p class="text-sm text-red-700 mt-1">
            该器材由 {{ activeBorrow.borrowerName }} ({{ activeBorrow.borrowerPhone }}) 于 
            {{ commonStore.formatDate(activeBorrow.borrowDate) }} 借出，
            应于 {{ commonStore.formatDate(activeBorrow.expectedReturnDate) }} 归还，
            已逾期 {{ overdueDays }} 天。
          </p>
        </div>
        <button class="btn btn-sm btn-red" @click="showReturnModal = true">立即处理</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">器材分类</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipmentStore.getCategoryLabel(equipment.category) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">品牌</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.brand || '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">型号</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.model || '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">序列号</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.serialNumber || '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">购买日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.purchaseDate ? commonStore.formatDate(equipment.purchaseDate) : '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">购买价格</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.purchasePrice ? '¥' + commonStore.formatMoney(equipment.purchasePrice) : '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">存放位置</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.location }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">上次保养</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ equipment.lastMaintenanceDate ? commonStore.formatDate(equipment.lastMaintenanceDate) : '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">下次保养</p>
              <p class="text-sm font-medium" :class="needsMaintenance ? 'text-red-600' : 'text-gray-900'" mt-1>{{ equipment.nextMaintenanceDate ? commonStore.formatDate(equipment.nextMaintenanceDate) : '--' }}</p>
            </div>
          </div>
          <div v-if="equipment.notes" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">备注</p>
            <p class="text-sm text-gray-900 mt-1">{{ equipment.notes }}</p>
          </div>
        </div>

        <div v-if="activeBorrow" class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">当前租借</h3>
            <span class="badge bg-amber-100 text-amber-800">进行中</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">借用人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ activeBorrow.borrowerName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">联系电话</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ activeBorrow.borrowerPhone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">借出日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ commonStore.formatDate(activeBorrow.borrowDate) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">预计归还</p>
              <p class="text-sm font-medium" :class="isOverdue ? 'text-red-600' : 'text-gray-900'" mt-1>{{ commonStore.formatDate(activeBorrow.expectedReturnDate) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">押金</p>
              <p class="text-sm font-medium text-amber-600 mt-1">¥{{ activeBorrow.depositPaid }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">押金状态</p>
              <p class="text-sm font-medium" :class="activeBorrow.depositReturned ? 'text-green-600' : 'text-amber-600'" mt-1>
                {{ activeBorrow.depositReturned ? '已退还' : '未退还' }}
              </p>
            </div>
            <div v-if="activeBorrow.relatedBookingNo" class="col-span-2">
              <p class="text-sm text-gray-500">关联预约</p>
              <p class="text-sm font-medium text-primary-600 cursor-pointer hover:underline mt-1" @click="navigateTo(`/booking/${activeBorrow.relatedBookingId}`)">
                {{ activeBorrow.relatedBookingNo }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">租借历史</h3>
            <span class="text-sm text-gray-500">共 {{ equipment.borrowHistory.length }} 条记录</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="record in sortedBorrowHistory"
              :key="record.id"
              class="p-4 rounded-lg border"
              :class="record.status === 'active' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span :class="getBorrowStatusBadgeClass(record.status)">
                    {{ getBorrowStatusLabel(record.status) }}
                  </span>
                  <span v-if="record.relatedBookingNo" class="text-xs text-gray-500">
                    关联：{{ record.relatedBookingNo }}
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ commonStore.formatDate(record.borrowDate) }} - {{ record.actualReturnDate ? commonStore.formatDate(record.actualReturnDate) : '未归还' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-500">借用人：</span>
                  <span class="font-medium text-gray-900">{{ record.borrowerName }}</span>
                </div>
                <div>
                  <span class="text-gray-500">联系电话：</span>
                  <span class="font-medium text-gray-900">{{ record.borrowerPhone }}</span>
                </div>
                <div>
                  <span class="text-gray-500">借出前状态：</span>
                  <span class="font-medium text-gray-900">{{ equipmentStore.getConditionLabel(record.conditionBefore) }}</span>
                </div>
                <div v-if="record.conditionAfter">
                  <span class="text-gray-500">归还后状态：</span>
                  <span class="font-medium" :class="record.conditionAfter === 'damaged' ? 'text-red-600' : 'text-gray-900'">
                    {{ equipmentStore.getConditionLabel(record.conditionAfter) }}
                  </span>
                </div>
                <div v-if="record.returnedCheckByName">
                  <span class="text-gray-500">验收人：</span>
                  <span class="font-medium text-gray-900">{{ record.returnedCheckByName }}</span>
                </div>
              </div>
              <div v-if="record.notes" class="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                <span class="text-gray-500">备注：</span>{{ record.notes }}
              </div>
            </div>
            <div v-if="equipment.borrowHistory.length === 0" class="text-center py-8 text-gray-500">
              暂无租借记录
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">维修记录</h3>
            <span class="text-sm text-gray-500">共 {{ equipment.maintenanceRecords.length }} 条记录</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="record in sortedMaintenanceRecords"
              :key="record.id"
              class="p-4 rounded-lg border bg-gray-50"
              :class="record.result === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-gray-200'"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span :class="getMaintenanceTypeBadgeClass(record.type)">
                    {{ getMaintenanceTypeLabel(record.type) }}
                  </span>
                  <span :class="record.result === 'pending' ? 'badge bg-amber-100 text-amber-800' : 'badge bg-green-100 text-green-800'">
                    {{ record.result === 'pending' ? '待处理' : '已完成' }}
                  </span>
                </div>
                <span class="text-xs text-gray-500">{{ commonStore.formatDate(record.date) }}</span>
              </div>
              <p class="text-sm text-gray-900 mb-2">{{ record.description }}</p>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>操作人：{{ record.operatorName }}</span>
                <span v-if="record.cost">费用：¥{{ commonStore.formatMoney(record.cost) }}</span>
              </div>
              <div v-if="record.result === 'pending' && userStore.hasPermission('equipment:maintenance')" class="mt-3">
                <button
                  class="btn btn-sm btn-primary"
                  @click="handleCompleteMaintenance(record.id)"
                >
                  标记完成
                </button>
              </div>
            </div>
            <div v-if="equipment.maintenanceRecords.length === 0" class="text-center py-8 text-gray-500">
              暂无维修记录
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">状态变更历史</h3>
          </div>
          <StatusTimeline :record-id="equipment.id" />
        </div>

        <div class="card">
          <RemarkList :record-id="equipment.id" />
        </div>
      </div>

      <div class="space-y-6">
        <RelatedInfoPanel
          :equipment-id="equipment.id"
        />

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">快速统计</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">总租借次数</span>
              <span class="text-sm font-medium text-gray-900">{{ equipment.borrowHistory.length }} 次</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">总维修次数</span>
              <span class="text-sm font-medium text-red-600">{{ equipment.maintenanceRecords.length }} 次</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">累计租借收入</span>
              <span class="text-sm font-medium text-green-600">¥{{ commonStore.formatMoney(totalRentalIncome) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">累计维修费用</span>
              <span class="text-sm font-medium text-red-600">¥{{ commonStore.formatMoney(totalMaintenanceCost) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">归还验收规范</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-gray-700"><span class="font-medium">完好：</span>外观无损伤，功能正常</p>
            </div>
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-gray-700"><span class="font-medium">一般：</span>轻微磨损，不影响使用</p>
            </div>
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p class="text-gray-700"><span class="font-medium">损坏：</span>明显损坏，需维修处理</p>
            </div>
          </div>
          <div class="mt-4 p-3 bg-amber-50 rounded-lg">
            <p class="text-xs text-amber-700">
              <span class="font-medium">注意：</span>归还状态为"损坏"或"遗失"时，押金将不予退还，并自动创建维修单通知相关人员。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReturnModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材归还验收</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">器材</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ equipment?.name }} ({{ equipment?.equipmentNo }})
            </p>
          </div>
          <div v-if="activeBorrow">
            <p class="text-sm text-gray-500">借用人</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ activeBorrow.borrowerName }} ({{ activeBorrow.borrowerPhone }})
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">归还状态 <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in returnConditionOptions"
                :key="option.value"
                :class="['py-2 px-3 rounded-lg border text-sm font-medium transition-colors', returnCondition === option.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300']"
                @click="returnCondition = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
            <textarea
              v-model="returnRemark"
              class="input"
              rows="3"
              :placeholder="returnCondition === 'damaged' ? '请详细描述损坏情况，包括损坏部位、程度等' : '可选填写'"
            />
          </div>
          <div v-if="returnCondition === 'damaged'" class="p-3 bg-amber-50 rounded-lg">
            <p class="text-sm text-amber-800 font-medium">押金处理</p>
            <p class="text-xs text-amber-600 mt-1">器材损坏，押金 ¥{{ equipment?.deposit }} 将不予退还，并自动创建维修单通知经理和教练主管</p>
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showReturnModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleReturn">确认归还</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLendModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材借出</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">器材</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ equipment?.name }} ({{ equipment?.equipmentNo }})
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">租借费</p>
              <p class="text-sm font-medium text-primary-600 mt-1">¥{{ equipment?.rentalFee }}/次</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">押金</p>
              <p class="text-sm font-medium text-amber-600 mt-1">¥{{ equipment?.deposit }}</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">借用人姓名 <span class="text-red-500">*</span></label>
            <input v-model="lendBorrowerName" type="text" class="input" placeholder="请输入借用人姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 <span class="text-red-500">*</span></label>
            <input v-model="lendBorrowerPhone" type="tel" class="input" placeholder="请输入联系电话" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预计归还日期</label>
            <input v-model="lendExpectedReturn" type="date" class="input" />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showLendModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleLend">确认借出</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMaintenanceModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">安排维修/保养</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">器材</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ equipment?.name }} ({{ equipment?.equipmentNo }})
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型 <span class="text-red-500">*</span></label>
            <select v-model="maintenanceType" class="input">
              <option value="routine">例行保养</option>
              <option value="repair">维修</option>
              <option value="inspection">检查</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">说明 <span class="text-red-500">*</span></label>
            <textarea
              v-model="maintenanceDescription"
              class="input"
              rows="3"
              placeholder="请详细描述需要处理的问题或保养内容"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预估费用</label>
            <input v-model.number="maintenanceCost" type="number" min="0" class="input" placeholder="可选" />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showMaintenanceModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleAddMaintenance">确认安排</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useEquipmentStore } from '~/stores/equipment'
import { useNotificationStore } from '~/stores/notification'
import StatusTimeline from '~/components/StatusTimeline.vue'
import RemarkList from '~/components/RemarkList.vue'
import RelatedInfoPanel from '~/components/RelatedInfoPanel.vue'
import type { Equipment, BorrowRecord, MaintenanceRecord } from '~/types'

const route = useRoute()
const userStore = useUserStore()
const commonStore = useCommonStore()
const equipmentStore = useEquipmentStore()
const notificationStore = useNotificationStore()

const equipment = ref<Equipment | null>(null)
const showReturnModal = ref(false)
const showLendModal = ref(false)
const showMaintenanceModal = ref(false)
const returnCondition = ref<'new' | 'good' | 'fair' | 'poor' | 'damaged'>('good')
const returnRemark = ref('')
const lendBorrowerName = ref('')
const lendBorrowerPhone = ref('')
const lendExpectedReturn = ref('')
const maintenanceType = ref<'routine' | 'repair' | 'inspection'>('routine')
const maintenanceDescription = ref('')
const maintenanceCost = ref<number | undefined>(undefined)

const returnConditionOptions: { value: 'new' | 'good' | 'fair' | 'poor' | 'damaged'; label: string }[] = [
  { value: 'good', label: '完好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
  { value: 'damaged', label: '损坏' }
]

const activeBorrow = computed(() => {
  if (!equipment.value) return null
  return equipment.value.borrowHistory.find(b => b.status === 'active')
})

const isOverdue = computed(() => {
  if (!activeBorrow.value) return false
  return new Date(activeBorrow.value.expectedReturnDate) < new Date()
})

const overdueDays = computed(() => {
  if (!isOverdue.value || !activeBorrow.value) return 0
  const diff = new Date().getTime() - new Date(activeBorrow.value.expectedReturnDate).getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const needsMaintenance = computed(() => {
  if (!equipment.value?.nextMaintenanceDate) return false
  return new Date(equipment.value.nextMaintenanceDate) < new Date()
})

const sortedBorrowHistory = computed(() => {
  if (!equipment.value) return []
  return [...equipment.value.borrowHistory].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()
  })
})

const sortedMaintenanceRecords = computed(() => {
  if (!equipment.value) return []
  return [...equipment.value.maintenanceRecords].sort((a, b) => {
    if (a.result === 'pending' && b.result !== 'pending') return -1
    if (a.result !== 'pending' && b.result === 'pending') return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
})

const totalRentalIncome = computed(() => {
  if (!equipment.value) return 0
  return equipment.value.borrowHistory
    .filter(b => b.status !== 'active')
    .length * equipment.value.rentalFee
})

const totalMaintenanceCost = computed(() => {
  if (!equipment.value) return 0
  return equipment.value.maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
})

function loadEquipment() {
  const id = route.params.id as string
  equipmentStore.setCurrentEquipment(id)
  equipment.value = equipmentStore.currentEquipment
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    available: 'badge bg-green-100 text-green-800',
    borrowed: 'badge bg-amber-100 text-amber-800',
    maintenance: 'badge bg-red-100 text-red-800',
    lost: 'badge bg-gray-100 text-gray-800',
    damaged: 'badge bg-red-100 text-red-800'
  }
  return map[status] || 'badge bg-gray-100 text-gray-800'
}

function getConditionBadgeClass(condition: string): string {
  const map: Record<string, string> = {
    new: 'badge bg-green-100 text-green-800',
    good: 'badge bg-blue-100 text-blue-800',
    fair: 'badge bg-yellow-100 text-yellow-800',
    poor: 'badge bg-orange-100 text-orange-800',
    damaged: 'badge bg-red-100 text-red-800'
  }
  return map[condition] || 'badge bg-gray-100 text-gray-800'
}

function getBorrowStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'badge bg-amber-100 text-amber-800',
    returned: 'badge bg-green-100 text-green-800',
    overdue: 'badge bg-red-100 text-red-800',
    lost: 'badge bg-gray-100 text-gray-800'
  }
  return map[status] || 'badge bg-gray-100 text-gray-800'
}

function getBorrowStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '租借中',
    returned: '已归还',
    overdue: '已逾期',
    lost: '已遗失'
  }
  return map[status] || status
}

function getMaintenanceTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    routine: 'badge bg-blue-100 text-blue-800',
    repair: 'badge bg-red-100 text-red-800',
    inspection: 'badge bg-purple-100 text-purple-800'
  }
  return map[type] || 'badge bg-gray-100 text-gray-800'
}

function getMaintenanceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    routine: '例行保养',
    repair: '维修',
    inspection: '检查'
  }
  return map[type] || type
}

function handleReturn() {
  if (!equipment.value) return

  const success = equipmentStore.returnEquipment(
    equipment.value.id,
    returnCondition.value,
    returnRemark.value
  )

  if (success) {
    notificationStore.showToastMessage('success', '器材归还成功')
    showReturnModal.value = false
    loadEquipment()
  } else {
    notificationStore.showToastMessage('error', '归还失败')
  }
}

function handleLend() {
  if (!equipment.value) return

  if (!lendBorrowerName.value.trim() || !lendBorrowerPhone.value.trim()) {
    notificationStore.showToastMessage('error', '请填写借用人信息')
    return
  }

  const borrowerId = `temp-${Date.now()}`
  const success = equipmentStore.lendEquipment(
    equipment.value.id,
    {
      id: borrowerId,
      name: lendBorrowerName.value,
      phone: lendBorrowerPhone.value
    },
    undefined,
    undefined,
    lendExpectedReturn.value || undefined
  )

  if (success) {
    notificationStore.showToastMessage('success', '器材借出成功')
    showLendModal.value = false
    loadEquipment()
  } else {
    notificationStore.showToastMessage('error', '借出失败')
  }
}

function handleAddMaintenance() {
  if (!equipment.value) return

  if (!maintenanceDescription.value.trim()) {
    notificationStore.showToastMessage('error', '请填写维修说明')
    return
  }

  equipmentStore.addMaintenance(
    equipment.value.id,
    maintenanceType.value,
    maintenanceDescription.value,
    maintenanceCost.value
  )

  notificationStore.showToastMessage('success', '已安排维修')
  showMaintenanceModal.value = false
  maintenanceDescription.value = ''
  maintenanceCost.value = undefined
  loadEquipment()
}

function handleCompleteMaintenance(maintenanceId: string) {
  if (!equipment.value) return

  const result = prompt('请输入维修处理结果：')
  if (!result) return

  equipmentStore.completeMaintenance(equipment.value.id, maintenanceId, result)
  notificationStore.showToastMessage('success', '维修已标记完成')
  loadEquipment()
}

onMounted(() => {
  loadEquipment()
})

onUnmounted(() => {
  equipmentStore.clearCurrentEquipment()
})
</script>
