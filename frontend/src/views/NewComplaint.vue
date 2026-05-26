<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-6">新建客诉登记</h3>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="space-y-4"
      >
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>

        <el-form-item label="联系电话" prop="customerPhone">
          <el-input v-model="form.customerPhone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="客诉类型" prop="complaintType">
          <el-select v-model="form.complaintType" class="w-full" placeholder="请选择客诉类型">
            <el-option
              v-for="type in COMPLAINT_TYPES"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="过磅单号" prop="weightNoteNo">
          <el-input v-model="form.weightNoteNo" placeholder="请输入过磅单号" />
        </el-form-item>

        <el-form-item label="冷库编号" prop="coldStorageNo">
          <el-input v-model="form.coldStorageNo" placeholder="请输入冷库编号" />
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述客诉问题"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            提交登记
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { complaintApi } from '../api';
import { COMPLAINT_TYPES } from '../types';

const router = useRouter();
const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  customerName: '',
  customerPhone: '',
  complaintType: '',
  weightNoteNo: '',
  coldStorageNo: '',
  description: '',
});

const rules: FormRules = {
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  complaintType: [{ required: true, message: '请选择客诉类型', trigger: 'change' }],
};

async function handleSubmit() {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    
    await complaintApi.create(form);
    
    ElMessage.success('客诉登记成功');
    router.push('/dashboard');
  } catch (error) {
    ElMessage.error('提交失败');
  } finally {
    loading.value = false;
  }
}
</script>
