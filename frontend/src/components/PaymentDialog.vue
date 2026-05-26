<template>
  <el-dialog
    v-model="visible"
    title="登记回款"
    width="500px"
    :close-on-click-modal="false"
    @closed="$emit('close')"
  >
    <div v-if="pendingCompensation" class="mb-4 p-4 bg-accent-50 rounded-lg">
      <p class="text-sm text-gray-600">待回款赔付金额：</p>
      <p class="text-2xl font-bold text-accent-600">¥{{ pendingCompensation.amount }}</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="mt-4"
    >
      <el-form-item label="回款金额" prop="amount">
        <el-input v-model="form.amount" type="number" placeholder="请输入回款金额">
          <template #prepend>¥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="回款方式" prop="paymentMethod">
        <el-select v-model="form.paymentMethod" class="w-full" placeholder="请选择回款方式">
          <el-option label="现金" value="现金" />
          <el-option label="银行转账" value="银行转账" />
          <el-option label="账扣" value="账扣" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入回款说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认回款</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { paymentApi } from '../api';
import type { Complaint } from '../types';

const props = defineProps<{
  complaint: Complaint | null;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const visible = ref(true);
const loading = ref(false);
const formRef = ref<FormInstance>();

const pendingCompensation = computed(() => {
  if (!props.complaint?.compensations) return null;
  return props.complaint.compensations.find(c => c.status === 'approved') || props.complaint.compensations[0];
});

const form = reactive({
  amount: pendingCompensation.value?.amount || 0,
  paymentMethod: '',
  remark: '',
});

const rules: FormRules = {
  amount: [{ required: true, message: '请输入回款金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择回款方式', trigger: 'change' }],
};

async function handleSubmit() {
  if (!formRef.value || !pendingCompensation.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    
    await paymentApi.create({
      ...form,
      compensationId: pendingCompensation.value.id,
      paymentDate: new Date(),
    });
    
    ElMessage.success('回款登记成功');
    emit('success');
  } catch (error) {
    ElMessage.error('提交失败');
  } finally {
    loading.value = false;
  }
}
</script>
