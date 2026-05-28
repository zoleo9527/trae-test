<template>
  <div class="ws-container" v-loading="loading">
    <section class="ws-section" v-if="continuous.order">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="margin:0">连续回查面板</h2>
          <div class="ws-order-sub" style="margin-top:4px">
            {{ continuous.order.order_no }} · {{ continuous.order.customer_name }} &amp; {{ continuous.order.partner_name }}
            <el-tag size="small" style="margin-left:6px">{{ continuous.order.status }}</el-tag>
            <el-tag size="small" :type="continuous.order.balance_status === '已结清' ? 'success' : 'warning'" style="margin-left:4px">尾款：{{ continuous.order.balance_status }}</el-tag>
          </div>
        </div>
        <div>
          <el-button @click="goDetail">订单详情</el-button>
          <el-button @click="goBack">返回列表</el-button>
          <el-button type="primary" @click="load">刷新</el-button>
        </div>
      </div>
    </section>

    <section class="ws-section" v-if="continuous.batches && continuous.batches.length">
      <h2>批次对比（按版本聚合）</h2>
      <el-alert type="info" :closable="false" title="同一订单所有回传批次在这里聚合，避免翻聊天记录拼接上下文。点击任意照片可复核、驳回或回查。" style="margin-bottom:12px" />

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane v-for="b in continuous.batches" :key="b.batch_id" :label="batchTabLabel(b)" :name="String(b.batch_id)">
          <div class="ws-order-sub" style="margin-bottom:10px">回传：{{ fmt(b.delivered_at) }} · 备注：{{ b.remark || '-' }}</div>
          <div class="ws-photo-grid">
            <div v-for="p in b.photos" :key="p.id" class="ws-photo-card" @click="openPhoto(p, b)">
              <img :src="p.image_url" :alt="p.photo_name" />
              <div class="ws-photo-meta">
                <div class="ws-photo-name">{{ p.photo_name }}</div>
                <div>{{ p.category }} · v{{ p.version }}</div>
                <span class="ws-badge" :class="p.review_status">{{ p.review_status }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section class="ws-section" v-if="comparisonRows.length">
      <h2>版本并排对比</h2>
      <div class="ws-compare">
        <div v-for="row in comparisonRows" :key="row.key" class="ws-compare-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <b>{{ row.key }}</b>
            <el-tag size="small">{{ row.latestStatus }}</el-tag>
          </div>
          <div class="ws-compare-grid">
            <div v-for="(p, idx) in row.photos" :key="idx" class="ws-compare-photo" @click="openPhotoFromCompare(p)">
              <img :src="p.image_url" :alt="p.photo_name" />
              <div style="padding:6px 8px;font-size:12px;">
                <div style="font-weight:500;">v{{ p.version }} · {{ p.category }}</div>
                <div style="color:#888">{{ fmt(batchTimeOf(p)) }}</div>
                <div><span class="ws-badge" :class="p.review_status">{{ p.review_status }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="photoDialog.visible" :title="photoDialogTitle" width="680px">
      <div v-if="photoDialog.photo">
        <img :src="photoDialog.photo.image_url" :alt="photoDialog.photo.photo_name" style="width:100%;max-height:360px;object-fit:cover;border-radius:6px;background:#eee" />
        <div style="margin-top:10px">
          <b>版本：</b>v{{ photoDialog.photo.version }} · <b>类别：</b>{{ photoDialog.photo.category }} · <b>状态：</b><span class="ws-badge" :class="photoDialog.photo.review_status">{{ photoDialog.photo.review_status }}</span>
        </div>
        <div v-if="photoDialog.photo.latest_feedback" style="margin-top:6px"><b>最新反馈：</b>{{ photoDialog.photo.latest_feedback }}</div>

        <el-divider>复核历史</el-divider>
        <el-timeline v-if="photoDialog.photo.reviews && photoDialog.photo.reviews.length">
          <el-timeline-item v-for="r in photoDialog.photo.reviews" :key="r.id" :timestamp="fmt(r.created_at)" placement="top">
            <div><b>{{ r.reviewer }}</b> 复核：<el-tag size="small" :type="verdictTagType(r.verdict)">{{ r.verdict }}</el-tag><span style="margin-left:8px;color:#888;font-size:12px">v{{ r.version_at_review }}</span></div>
            <div v-if="r.feedback" style="margin-top:4px;color:#555">{{ r.feedback }}</div>
          </el-timeline-item>
        </el-timeline>
        <div v-else class="ws-empty">暂无复核记录</div>

        <el-divider>复核 / 回查</el-divider>
        <el-form label-width="80px">
          <el-form-item label="复核结论">
            <el-radio-group v-model="reviewForm.verdict">
              <el-radio-button label="通过">通过</el-radio-button>
              <el-radio-button label="驳回">驳回</el-radio-button>
              <el-radio-button label="回查">回查</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="反馈"><el-input v-model="reviewForm.feedback" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="复核人"><el-input v-model="reviewForm.reviewer" /></el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="photoDialog.visible = false">关闭</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">提交复核</el-button>
        <el-button type="warning" :loading="submitting" @click="resubmit">二次回传（v+1）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

interface Review { id: number; reviewer: string; verdict: string; feedback: string; version_at_review: number; created_at: string }
interface Photo { id: number; photo_name: string; category: string; image_url: string; version: number; review_status: string; latest_feedback: string; source_photo_id: number | null; reviews: Review[]; created_at?: string }
interface BatchGroup { batch_id: number; batch_no: number; status: string; remark: string; delivered_at: string; photos: Photo[] }
interface Continuous { order: { id: number; order_no: string; customer_name: string; partner_name: string; status: string; balance_status: string } | null; batches: BatchGroup[] }

const route = useRoute()
const api = useWsApi()

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('')

const continuous = reactive<Continuous>({ order: null, batches: [] })

const photoDialog = reactive<{ visible: boolean; photo: Photo | null; batch: BatchGroup | null }>({ visible: false, photo: null, batch: null })
const reviewForm = reactive({ verdict: '通过', feedback: '', reviewer: '客户' })

const fmt = (d: any) => { if (!d) return '-'; const s = typeof d === 'string' ? d : new Date(d).toISOString(); return s.slice(0, 16).replace('T', ' ') }
const goDetail = () => continuous.order && navigateTo(`/orders/${continuous.order.id}`)
const goBack = () => navigateTo('/orders')
const batchTabLabel = (b: BatchGroup) => `第 ${b.batch_no} 次 · ${b.status}`
const photoDialogTitle = computed(() => photoDialog.photo ? photoDialog.photo.photo_name : '')
const verdictTagType = (v: string) => v === '通过' ? 'success' : (v === '驳回' ? 'danger' : 'warning')

const load = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const data = await api.get<Continuous>(`/orders/${id}/continuous-review`)
    continuous.order = data.order
    continuous.batches = data.batches || []
    if (continuous.batches.length) {
      activeTab.value = String(continuous.batches[continuous.batches.length - 1].batch_id)
    }
  } catch (e) { /* ignore */ }
  finally { loading.value = false }
}

const comparisonRows = computed(() => {
  const map: Record<string, { key: string; latestStatus: string; photos: Photo[] }> = {}
  for (const b of continuous.batches) {
    for (const p of b.photos) {
      const key = p.photo_name
      if (!map[key]) map[key] = { key, latestStatus: p.review_status, photos: [] }
      map[key].photos.push(p)
      map[key].latestStatus = p.review_status
    }
  }
  return Object.values(map)
    .filter(row => row.photos.length > 1)
    .map(row => ({
      ...row,
      photos: row.photos.sort((a, b) => b.version - a.version).slice(0, 4)
    }))
})

const batchTimeOf = (p: Photo) => {
  for (const b of continuous.batches) {
    if (b.photos.some(x => x.id === p.id)) return b.delivered_at
  }
  return p.created_at
}

const openPhoto = (p: Photo, b: BatchGroup) => {
  photoDialog.photo = p
  photoDialog.batch = b
  photoDialog.visible = true
  reviewForm.verdict = '通过'
  reviewForm.feedback = ''
  reviewForm.reviewer = '客户'
}

const openPhotoFromCompare = (p: Photo) => {
  photoDialog.photo = p
  photoDialog.batch = null
  photoDialog.visible = true
  reviewForm.verdict = '通过'
  reviewForm.feedback = ''
  reviewForm.reviewer = '客户'
}

const submitReview = async () => {
  if (!photoDialog.photo) return
  submitting.value = true
  try {
    await api.post<Photo>(`/photos/${photoDialog.photo.id}/review`, { ...reviewForm })
    ElMessage.success('复核已提交')
    photoDialog.visible = false
    load()
  } catch (e) { /* api shows error */ }
  finally { submitting.value = false }
}

const resubmit = async () => {
  if (!photoDialog.photo) return
  submitting.value = true
  try {
    const updated = await api.post<Photo>(`/photos/${photoDialog.photo.id}/resubmit`, {
      image_url: photoDialog.photo.image_url,
      remark: reviewForm.feedback || '修片师二次回传'
    })
    ElMessage.success(`已回传 v${updated.version}`)
    photoDialog.visible = false
    load()
  } catch (e) { /* api shows error */ }
  finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.ws-order-sub { margin-top: 2px; color: var(--ws-muted); font-size: 13px; }
.ws-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.ws-compare-photo { background: #fff; border: 1px solid #eee; border-radius: 6px; overflow: hidden; cursor: pointer; transition: transform 0.15s; }
.ws-compare-photo:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.ws-compare-photo img { width: 100%; height: 160px; object-fit: cover; background: #eee; }
</style>
