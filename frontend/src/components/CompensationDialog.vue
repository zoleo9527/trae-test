<template>
  <el-dialog
    v-model="visible"
    title="申请赔付"
    width="500px"
    :close-on-click-modal="false"
    @closed="$emit('close')"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="mt-4"
    >
      <el-form-item label="赔付金额" prop="amount">
        <el-input v-model="form.amount" type="number" placeholder="请输入赔付金额">
          <template #prepend>¥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="赔付方式" prop="compensationMethod">
        <el-select v-model="form.compensationMethod" class="w-full" placeholder="请选择赔付方式">
          <el-option label="退款" value="退款" />
          <el-option label="抵扣下次货款" value="抵扣下次货款" />
          <el-option label="补发货物" value="补发货物" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入赔付说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { compensationApi } from '../api';

const props = defineProps<{
  complaintId: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const visible = ref(true);
const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  amount: 0,
  compensationMethod: '',
  remark: '',
});

const rules: FormRules = {
  amount: [{ required: true, message: '请输入赔付金额', trigger: 'blur' }],
  compensationMethod: [{ required: true, message: '请选择赔付方式', trigger: 'change' }],
};

async function handleSubmit() {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    
    await compensationApi.create({
      ...form,
      complaintId: props.complaintId,
    });
    
    ElMessage.success('赔付申请已提交');
    emit('success');
  } catch (error) {
    ElMessage.error('提交失败');
  } finally {
    loading.value = false;
  }
}
</script>
