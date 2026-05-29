<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <el-icon size="40"><Tools /></el-icon>
          <h1>汽配商行管理系统</h1>
          <p>账期客户与回款催办平台</p>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="demo-users">
        <p>演示账号：</p>
        <el-tag type="info">boss / 123456 (门店老板)</el-tag>
        <el-tag type="success">sales1 / 123456 (配件销售)</el-tag>
        <el-tag type="warning">warehouse / 123456 (库管)</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { Tools, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    await authStore.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
}

.login-header h1 {
  margin: 10px 0 5px;
  font-size: 22px;
  color: #333;
}

.login-header p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.login-btn {
  width: 100%;
}

.demo-users {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.demo-users p {
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.demo-users .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
