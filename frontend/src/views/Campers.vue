<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索营员姓名、电话..."
          style="width: 300px"
          :prefix-icon="Search"
          clearable
        />
        <el-select v-model="filterGender" placeholder="性别筛选" clearable style="width: 120px">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
        <el-select v-model="filterRoom" placeholder="房间筛选" clearable style="width: 150px">
          <el-option
            v-for="room in rooms"
            :key="room.id"
            :label="`${room.building} ${room.name}`"
            :value="room.id"
          />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
        添加营员
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="filteredCampers" stripe>
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                :class="row.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
              >
                {{ row.name.charAt(0) }}
              </div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="parentName" label="家长姓名" width="100" />
        <el-table-column prop="parentPhone" label="联系电话" width="140" />
        <el-table-column prop="allergy" label="过敏史" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.allergy" type="danger" size="small">
              {{ row.allergy }}
            </el-tag>
            <span v-else class="text-gray-400">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="medicalHistory" label="病史" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.medicalHistory" type="warning" size="small">
              {{ row.medicalHistory }}
            </el-tag>
            <span v-else class="text-gray-400">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="roomId" label="房间" width="120">
          <template #default="{ row }">
            <span v-if="row.roomId" class="text-blue-600">
              {{ getRoomName(row.roomId) }} {{ row.bedNumber }}号床
            </span>
            <span v-else class="text-gray-400">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="primary" @click="editCamper(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteCamper(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加营员" width="600px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="6" :max="18" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="form.idCard" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家长姓名">
              <el-input v-model="form.parentName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.parentPhone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过敏史">
              <el-input v-model="form.allergy" placeholder="无则不填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="病史">
              <el-input v-model="form.medicalHistory" placeholder="无则不填" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCamper">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { camperApi, roomApi } from '@/api'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const campers = ref<any[]>([])
const rooms = ref<any[]>([])
const searchKeyword = ref('')
const filterGender = ref('')
const filterRoom = ref('')
const showAddDialog = ref(false)
const form = ref<any>({
  name: '',
  gender: 'male',
  age: 12,
  idCard: '',
  parentName: '',
  parentPhone: '',
  allergy: '',
  medicalHistory: '',
})

const filteredCampers = computed(() => {
  return campers.value.filter((c) => {
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (!c.name.toLowerCase().includes(keyword) && !c.parentPhone.includes(keyword)) {
        return false
      }
    }
    if (filterGender.value && c.gender !== filterGender.value) {
      return false
    }
    if (filterRoom.value && c.roomId !== filterRoom.value) {
      return false
    }
    return true
  })
})

const getRoomName = (roomId: string) => {
  const room = rooms.value.find((r) => r.id === roomId)
  return room ? `${room.building}${room.name}` : '未知'
}

const loadData = async () => {
  try {
    campers.value = await camperApi.getList()
    rooms.value = await roomApi.getList()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const viewDetail = (row: any) => {
  router.push(`/campers/${row.id}`)
}

const editCamper = (row: any) => {
  form.value = { ...row }
  showAddDialog.value = true
}

const deleteCamper = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该营员吗？', '提示', {
      type: 'warning',
    })
    await camperApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    // 用户取消
  }
}

const saveCamper = async () => {
  try {
    if (form.value.id) {
      await camperApi.update(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await camperApi.create(form.value)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
