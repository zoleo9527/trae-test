<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Tractor, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref('dispatcher');
const password = ref('123456');
const error = ref('');

function submit() {
  error.value = '';
  if (!auth.login({ username: username.value, password: password.value })) {
    error.value = '账号或密码不正确，请使用演示账号';
    return;
  }
  const redirect = (route.query.r as string) || '/';
  router.replace(redirect);
}

const demoAccounts = [
  { u: 'director',   p: '123456', label: '合作社理事' },
  { u: 'dispatcher', p: '123456', label: '调度员' },
  { u: 'operator',   p: '123456', label: '机手' },
];

function fill(u: string, p: string) {
  username.value = u;
  password.value = p;
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-5xl grid md:grid-cols-2 gap-6">
      <div class="surface p-8 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-ink-900 text-amber-450 grid place-items-center">
              <Tractor :size="22" />
            </div>
            <div>
              <div class="text-ink-950 font-semibold">农机合作社</div>
              <div class="text-xs text-ink-900/60">作业预约 · 机手排班 · 异常留痕</div>
            </div>
          </div>

          <h2 class="mt-8 text-2xl font-semibold text-ink-950 leading-snug">
            把电话、作业表、油料本<br />接到一条看得见的链路上
          </h2>
          <p class="mt-3 text-sm text-ink-900/70 leading-relaxed">
            理事、调度员、机手按角色接力。作业谁改过、谁确认过、谁还没处理，都在同一页能看到；地块进度、补贴材料、维修和回访的异常，不再靠聊天工具补说明。
          </p>
        </div>

        <div class="mt-10">
          <div class="text-xs text-ink-900/60 mb-3">演示账号（点击一键填充）</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in demoAccounts"
              :key="a.u"
              class="chip border-ink-900/10 bg-ink-900/5 hover:bg-amber-450/20 transition-colors"
              @click="fill(a.u, a.p)"
            >
              <span class="text-ink-900/70">{{ a.label }}</span>
              <span class="text-ink-900 font-medium">{{ a.u }}</span>
              <span class="text-ink-900/40">/{{ a.p }}</span>
            </button>
          </div>
        </div>
      </div>

      <form class="surface p-8 flex flex-col" @submit.prevent="submit">
        <div class="text-sm text-ink-900/70">登录</div>
        <div class="text-2xl font-semibold text-ink-950 mt-1">进入协作工作台</div>

        <div class="mt-8 space-y-4">
          <div>
            <label class="field-label">账号</label>
            <input v-model="username" class="field-input" placeholder="dispatcher" autocomplete="username" />
          </div>
          <div>
            <label class="field-label">密码</label>
            <input v-model="password" type="password" class="field-input" placeholder="123456" autocomplete="current-password" />
          </div>
          <div v-if="error" class="text-xs text-danger-500">{{ error }}</div>
        </div>

        <button class="btn-primary mt-8 justify-between">
          <span>进入</span>
          <ArrowRight :size="16" />
        </button>

        <div class="mt-6 text-[11px] text-ink-900/50 leading-relaxed">
          说明：本演示不涉及真实数据与鉴权。刷新后所有数据会重置。
        </div>
      </form>
    </div>
  </div>
</template>
