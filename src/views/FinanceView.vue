<template>
  <div>
    <div class="page-title">
      <div>
        <h2>对账留痕</h2>
        <div class="subtitle">样书回执、退货口径一致性核对，所有处理动作沉淀为可追溯的留痕记录</div>
      </div>
      <div>
        <el-tag size="small" type="warning">口径不一 {{ store.overview.mismatches }}</el-tag>
        <el-tag size="small" type="danger" style="margin-left: 8px;">回执丢失 {{ store.overview.receiptsMissing }}</el-tag>
      </div>
    </div>

    <RoleBanner />

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">样书回执跟踪</div>
        <div>
          <el-radio-group :model-value="receiptTab" @change="receiptTab = $event" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="missing">丢失</el-radio-button>
            <el-radio-button value="confirmed">已确认</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table :data="receiptFiltered" stripe style="width: 100%">
        <el-table-column prop="id" label="回执单" width="150" />
        <el-table-column label="关联申请" width="160">
          <template #default="{ row }">
            <span class="row-link" @click="jumpReturn(row.returnApplicationId)">{{ row.returnApplicationId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" min-width="180" />
        <el-table-column prop="bookTitle" label="书名" min-width="160" />
        <el-table-column prop="qty" label="册数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="receiptTag(row.status)">{{ receiptLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReceipt(row)">补录</el-button>
            <el-button v-if="row.status === 'missing'" link type="success" @click="confirm(row)">
              确认已补
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <EmptyBlock v-if="!receiptFiltered.length" text="当前筛选下无记录" />
    </section>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">退货口径一致性</div>
        <div>
          <el-radio-group :model-value="reconTab" @change="reconTab = $event" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="mismatch">口径不一</el-radio-button>
            <el-radio-button value="matched">已一致</el-radio-button>
            <el-radio-button value="pending">待核</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table :data="reconFiltered" stripe style="width: 100%">
        <el-table-column prop="id" label="台账编号" width="150" />
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="channel" label="渠道" min-width="180" />
        <el-table-column prop="bookTitle" label="书名" min-width="160" />
        <el-table-column prop="expectedReturn" label="应退" width="80" />
        <el-table-column prop="actualReturn" label="实退" width="80" />
        <el-table-column label="差额" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.delta === 0 ? 'var(--app-success)' : 'var(--app-danger)' }">
              {{ row.delta }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="reconTag(row.status)">{{ reconLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="caliber" label="口径说明" min-width="160" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="review(row)">重新核对</el-button>
          </template>
        </el-table-column>
      </el-table>

      <EmptyBlock v-if="!reconFiltered.length" text="当月对账数据为空" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConsoleStore } from '@/stores/console'
import RoleBanner from '@/components/common/RoleBanner.vue'
import EmptyBlock from '@/components/common/EmptyBlock.vue'
import type { ReconciliationRecord, SampleReceipt } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const store = useConsoleStore()

const receiptTab = ref('all')
const reconTab = ref('all')

watch(() => route.query.tab, (t) => {
  if (t === 'receipt') receiptTab.value = 'missing'
  if (t === 'mismatch') reconTab.value = 'mismatch'
})

const receiptFiltered = computed(() => {
  if (receiptTab.value === 'all') return store.receipts
  if (receiptTab.value === 'missing') return store.receipts.filter(r => r.status === 'missing')
  if (receiptTab.value === 'confirmed') return store.receipts.filter(r => r.status === 'confirmed')
  return store.receipts
})

const reconFiltered = computed(() => {
  if (reconTab.value === 'all') return store.reconciliations
  return store.reconciliations.filter(r => r.status === reconTab.value)
})

function receiptLabel(s: SampleReceipt['status']) {
  return { pending: '待提交', submitted: '已提交', missing: '丢失', confirmed: '已确认' }[s]
}
function receiptTag(s: SampleReceipt['status']) {
  return ({ pending: 'info', submitted: 'warning', missing: 'danger', confirmed: 'success' } as const)[s] || ''
}
function reconLabel(s: ReconciliationRecord['status']) {
  return { matched: '已一致', mismatch: '口径不一', pending: '待核' }[s]
}
function reconTag(s: ReconciliationRecord['status']) {
  return ({ matched: 'success', mismatch: 'danger', pending: 'warning' } as const)[s] || ''
}

function jumpReturn(id: string) {
  store.selectReturn(id)
  router.push('/returns')
}

function openReceipt(row: SampleReceipt) {
  store.openDrawer({ visible: true, mode: 'receipt', title: `补样书回执 ${row.id}`, context: row })
}

function confirm(row: SampleReceipt) {
  store.confirmReceipt(row.id)
}

function review(row: ReconciliationRecord) {
  store.selectReconciliation(row.id)
  store.markReconciliationReviewed(row.id, '已重新核对铺货台账与实退数据，口径一致')
}
</script>
