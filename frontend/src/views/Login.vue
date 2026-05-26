<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <component :is="ClipboardList" class="w-8 h-8 text-primary-600" />
          </div>
          <h1 class="text-2xl font-bold text-gray-800">水果批发客诉系统</h1>
          <p class="text-gray-500 mt-2">客诉赔付与复检登记</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="space-y-4"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500 mb-2">演示账号：</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">档口负责人：</span>
              <span class="font-mono text-primary-600">manager / 123456</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">配货员：</span>
              <span class="font-mono text-primary-600">picker / 123456</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">财务记账：</span>
              <span class="font-mono text-primary-600">accountant / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, ClipboardList } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    await authStore.login(form.username, form.password);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>
