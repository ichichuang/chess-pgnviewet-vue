<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import { useAuthStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const account = ref('')
const password = ref('')
const submitting = computed(() => auth.status === 'submitting')

function safeNext(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text || !text.startsWith('/') || text.startsWith('//')) return '/'
  for (const character of text) {
    const code = character.charCodeAt(0)

    if (
      code <= 31 ||
      character === '<' ||
      character === '>' ||
      character === '`' ||
      character === '"' ||
      character === "'" ||
      character === '\\'
    ) {
      return '/'
    }
  }
  return text
}

async function submitLogin(): Promise<void> {
  try {
    await auth.login(account.value, password.value)
    await router.replace(safeNext(route.query.next))
  } catch {
    password.value = ''
  }
}
</script>

<template>
  <main class="product-route">
    <RouteHeader title="登录" subtitle="使用生产认证接口建立当前会话" />

    <section class="login-surface" aria-labelledby="login-title">
      <form class="login-form" @submit.prevent="submitLogin">
        <h2 id="login-title">账号登录</h2>
        <label>
          <span>账号</span>
          <input v-model.trim="account" autocomplete="username" required />
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" autocomplete="current-password" required type="password" />
        </label>
        <p v-if="auth.lastError" class="form-error">{{ auth.lastError }}</p>
        <button type="submit" :disabled="submitting">
          {{ submitting ? '登录中' : '登录' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.product-route {
  display: flex;
  flex-direction: column;
  min-height: var(--workspace-viewport-h);
  background: var(--bg);
  color: var(--text);
}

.login-surface {
  display: grid;
  flex: 1 1 auto;
  place-items: start center;
  min-height: 0;
  padding: var(--s-8) var(--s-5);
  overflow: auto;
}

.login-form {
  display: grid;
  gap: var(--s-4);
  width: min(100%, 420px);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.login-form h2,
.login-form p {
  margin: 0;
}

.login-form h2 {
  font-size: var(--fs-lg);
}

.login-form label {
  display: grid;
  gap: var(--s-2);
}

.login-form span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.login-form input {
  min-height: var(--control-h);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
}

.login-form button {
  min-height: var(--control-h);
  border: var(--workspace-border-w) solid var(--accent);
  border-radius: var(--r-sm);
  background: var(--accent-bg);
  color: var(--accent-strong);
  font: inherit;
  cursor: pointer;
}

.login-form button:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.form-error {
  color: var(--danger);
  font-size: var(--fs-sm);
}
</style>
