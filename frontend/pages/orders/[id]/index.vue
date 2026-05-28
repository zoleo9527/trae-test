<template>
  <div class="ws-container">
    <div v-if="!order" class="ws-empty">加载中...</div>
    <div v-else>
      <section class="ws-section">
        <div class="ws-order-head">
          <div>
            <h2 style="margin:0">{{ order.order_no }} · {{ order.customer_name }} &amp; {{ order.partner_name }}</h2>
            <div class="ws-order-sub">{{ order.studio_branch }} · 套餐：{{ order.package }} · 拍摄：{{ fmt(order.shoot_date) }} · 选片：{{ fmt(order.select_date) }}</div>
            <div class="ws-order-sub">店长：{{ order.store_manager }} · 选片：{{ order.selector }} · 修片：{{ order.retoucher }} · 客服：{{ order.customer_service }}</div>
          </div>
          <div class="ws-order-actions">
            <div>
              <el-tag :type="order.balance_status === '已结清' ? 'success' : 'warning'" style="margin-right:8px">尾款：{{ order.balance_status }}</el-tag>
              <el-tag>{{ order.status }}</el-tag>
            </div>
            <div class="ws-order-btn-row">
              <el-button size="small" @click="goBack">返回</el-button>
              <el-button size="small" type="primary" @click="openAddBatch">新增回传批次</el-button>
              <el-button size="small" @click="goContinuous">连续回查面板</el-button>
            </div>
          </div>
        </div>
        <el-alert v-if="order.remark" :title="order.remark" type="info" :closable="false" style="margin-top:12px" />
      </section>

      <section class="ws-section">
        <h2>时间线</h2>
        <div class="ws-timeline">
          <div v-for="e in timeline" :key="e.id" class="ws-timeline-item">
            <div class="ws-tl-title">{{ e.title }}</div>
            <div class="ws-tl-meta">{{ e.event_type }} · {{ e.operator }} · {{ fmt(e.created_at) }}</div>
            <div v-if="e.detail" class="ws-tl-detail">{{ e.detail }}</div>
          </div>
        </div>
      </section>

      <section class="ws-section">
        <h2>批次回传</h2>
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane v-for="b in order.batches" :key="b.id" :label="batchLabel(b)" :name="String(b.id)">
            <div class="ws-order-sub" style="margin-bottom:10px">回传时间：{{ fmt(b.delivered_at) }} · 备注：{{ b.remark || '-' }}</div>
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
            <div v-if="!b.photos || b.photos.length === 0" class="ws-empty">该批次暂无照片</div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <el-dialog v-model="photoDialog.visible" :title="photoDialogTitle" width="680px">
      <div v-if="photoDialog.photo">
        <img :src="photoDialog.photo.image_url" :alt="photoDialog.photo.photo_name" style="width:100%;max-height:360px;object-fit:cover;border-radius:6px;background:#eee" />
        <div style="margin-top:10px">
          <div><b>类别：</b>{{ photoDialog.photo.category }} · <b>版本：</b>v{{ photoDialog.photo.version }}</div>
          <div><b>状态：</b><span class="ws-badge" :class="photoDialog.photo.review_status">{{ photoDialog.photo.review_status }}</span></div>
          <div v-if="photoDialog.photo.latest_feedback" style="margin-top:6px"><b>最新反馈：</b>{{ photoDialog.photo.latest_feedback }}</div>
        </div>

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
          <el-form-item label="反馈"><el-input v-model="reviewForm.feedback" type="textarea" :rows="3" placeholder="针对这张图的具体反馈..." /></el-form-item>
          <el-form-item label="复核人"><el-input v-model="reviewForm.reviewer" /></el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="photoDialog.visible = false">关闭</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">提交复核</el-button>
        <el-button type="warning" :loading="submitting" @click="resubmitPhoto">二次回传（版本+1）</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addBatchDialog.visible" title="新增回传批次" width="520px">
      <el-form label-width="90px">
        <el-form-item label="批次序号"><el-input-number v-model="addBatchForm.batch_no" :min="1" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="addBatchForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addBatchDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAddBatch">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

interface Review { id: number; reviewer: string; verdict: string; feedback: string; version_at_review: number; created_at: string }
interface Photo { id: number; batch_id: number; photo_name: string; category: string; image_url: string; version: number; review_status: string; latest_feedback: string; source_photo_id: number | null; reviews: Review[] }
interface Batch { id: number; order_id: number; batch_no: number; status: string; remark: string; delivered_at: string; photos: Photo[] }
interface TimelineEvent { id: number; event_type: string; title: string; detail: string; operator: string; created_at: string }
interface Order { id: number; order_no: string; customer_name: string; partner_name: string; phone: string; studio_branch: string; package: string; shoot_date: string; select_date: string; store_manager: string; selector: string; retoucher: string; customer_service: string; remark: string; balance_status: string; status: string; batches: Batch[] }

const route = useRoute()
const api = useWsApi()

const order = ref<Order | null>(null)
const timeline = ref<TimelineEvent[]>([])
const activeTab = ref('')
const submitting = ref(false)

const photoDialog = reactive<{ visible: boolean; photo: Photo | null; batch: Batch | null }>({ visible: false, photo: null, batch: null })
const reviewForm = reactive({ verdict: '通过', feedback: '', reviewer: '客户' })
const addBatchDialog = reactive({ visible: false })
const addBatchForm = reactive({ batch_no: 1, remark: '' })

const fmt = (d: any) => { if (!d) return '-'; const s = typeof d === 'string' ? d : new Date(d).toISOString(); return s.slice(0, 16).replace('T', ' ') }
const goBack = () => navigateTo('/orders')
const goContinuous = () => order.value && navigateTo(`/orders/${order.value.id}/continuous`)
const batchLabel = (b: Batch) => `第 ${b.batch_no} 次 · ${b.status}`
const photoDialogTitle = computed(() => photoDialog.photo ? photoDialog.photo.photo_name : '')
const verdictTagType = (v: string) => v === '通过' ? 'success' : (v === '驳回' ? 'danger' : 'warning')

const load = async () => {
  try {
    const id = route.params.id as string
    order.value = await api.get<Order>(`/orders/${id}`)
    timeline.value = await api.get<TimelineEvent[]>(`/orders/${id}/timeline`)
    if (order.value.batches && order.value.batches.length) {
      activeTab.value = String(order.value.batches[order.value.batches.length - 1].id)
    }
  } catch (e) { /* ignore */ }
}

const openPhoto = (p: Photo, b: Batch) => {
  photoDialog.photo = p
  photoDialog.batch = b
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
  } catch (e) { /* api layer shows error */ }
  finally { submitting.value = false }
}

const resubmitPhoto = async () => {
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
  } catch (e) { /* api layer shows error */ }
  finally { submitting.value = false }
}

const openAddBatch = () => {
  if (order.value) {
    addBatchForm.batch_no = ((order.value.batches && order.value.batches.length) || 0) + 1
    addBatchForm.remark = ''
    addBatchDialog.visible = true
  }
}

const submitAddBatch = async () => {
  if (!order.value) return
  submitting.value = true
  try {
    await api.post<Batch>(`/orders/${order.value.id}/batches`, {
      batch_no: addBatchForm.batch_no,
      remark: addBatchForm.remark,
      photos: []
    })
    ElMessage.success('批次已创建')
    addBatchDialog.visible = false
    load()
  } catch (e) { /* api layer shows error */ }
  finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.ws-order-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.ws-order-sub { margin-top: 2px; color: var(--ws-muted); font-size: 13px; }
.ws-order-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.ws-order-btn-row { display: flex; gap: 6px; }
</style>
