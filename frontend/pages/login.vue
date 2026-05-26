<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100"
  >
    <div class="card w-[420px] p-8">
      <div class="text-center mb-6">
        <div class="text-2xl font-bold text-brand-700">水果批发 · 档口台账</div>
        <div class="text-sm text-slate-500 mt-1">
          进货分级 & 档口配货 & 赊销结算
        </div>
      </div>
      <form @submit.prevent="submit" class="space-y-3">
        <div>
          <label class="label">账号</label>
          <input
            v-model="username"
            class="input"
            placeholder="admin / picker / finance"
          />
        </div>
        <div>
          <label class="label">密码</label>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="admin123 等"
          />
        </div>
        <div v-if="error" class="text-rose-600 text-sm">{{ error }}</div>
        <button class="btn-primary w-full">登录</button>
      </form>
      <div class="mt-5 text-xs text-slate-500 space-y-1">
        <div>测试账号：</div>
        <div>档口负责人：<b>admin / admin123</b></div>
        <div>配货员：<b>picker / picker123</b></div>
        <div>财务记账：<b>finance / finance123</b></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const username = ref("admin");
const password = ref("admin123");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(username.value, password.value);
    navigateTo(auth.defaultRoute);
  } catch (e: any) {
    error.value = e?.data?.detail || "登录失败";
  }
}
</script>
