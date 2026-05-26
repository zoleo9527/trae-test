<template>
  <el-dialog
    v-model="visible"
    title="登记复检"
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
      <el-form-item label="复检人员" prop="recheckPerson">
        <el-input v-model="form.recheckPerson" placeholder="请输入复检人员" />
      </el-form-item>
      
      <el-form-item label="冷库位置" prop="coldStorageLocation">
        <el-input v-model="form.coldStorageLocation" placeholder="如：A区-1排-5号" />
      </el-form-item>

      <el-form-item label="分级结果" prop="gradeResult">
        <el-select v-model="form.gradeResult" class="w-full" placeholder="请选择分级结果">
          <el-option label="A级" value="A级" />
          <el-option label="B级" value="B级" />
          <el-option label="C级" value="C级" />
          <el-option label="不合格" value="不合格" />
        </el-select>
      </el-form-item>

      <el-form-item label="损耗比例(%)" prop="lossRatio">
        <el-input-number
          v-model="form.lossRatio"
          :min="0"
          :max="100"
          :step="0.1"
          class="w-full"
          @change="calculateAmount"
        />
      </el-form-item>

      <el-form-item label="损耗金额" prop="lossAmount">
        <el-input v-model="form.lossAmount" type="number" placeholder="请输入损耗金额">
          <template #prepend>¥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入复检备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { recheckApi } from '../api';

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
  recheckPerson: '',
  coldStorageLocation: '',
  gradeResult: '',
  lossRatio: 0,
  lossAmount: 0,
  remark: '',
});

const rules: FormRules = {
  recheckPerson: [{ required: true, message: '请输入复检人员', trigger: 'blur' }],
  gradeResult: [{ required: true, message: '请选择分级结果', trigger: 'change' }],
};

function calculateAmount() {
  if (form.lossRatio) {
    form.lossAmount = Math.round(form.lossRatio * 100);
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    
    await recheckApi.create({
      ...form,
      complaintId: props.complaintId,
      recheckTime: new Date(),
    });
    
    ElMessage.success('复检登记成功');
    emit('success');
  } catch (error) {
    ElMessage.error('提交失败');
  } finally {
    loading.value = false;
  }
}
</script>
