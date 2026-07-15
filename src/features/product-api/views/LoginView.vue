<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh
- Module: centered account login form
- Scroll owner: login surface
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { safeAuthReturnPath } from '@/router'
import { useAuthStore } from '@/stores'
import {
  ProductButton,
  ProductField,
  ProductPasswordField,
} from '@/ui'
import type { ComponentPublicInstance } from 'vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const account = ref('')
const password = ref('')
const validationError = ref('')
const accountInput = ref<ComponentPublicInstance<{ focus: () => void }> | null>(null)
const passwordInput = ref<ComponentPublicInstance<{ focus: () => void }> | null>(null)

const errorMessage = computed(() => validationError.value || auth.lastError || '')
const returnPath = computed(() => safeAuthReturnPath(route.query.return))
const returnLocation = computed<RouteLocationRaw>(() =>
  returnPath.value ? returnPath.value : { name: 'competitions' }
)

onMounted(() => {
  void nextTick(() => {
    accountInput.value?.focus()
  })
})

async function submit(): Promise<void> {
  if (auth.isSubmitting) return

  validationError.value = ''
  const normalizedAccount = account.value.trim()

  if (!normalizedAccount) {
    validationError.value = '请输入账号。'
    await nextTick()
    accountInput.value?.focus()
    return
  }

  if (!password.value) {
    validationError.value = '请输入密码。'
    await nextTick()
    passwordInput.value?.focus()
    return
  }

  const submittedPassword = password.value
  const authenticated = await auth.login(normalizedAccount, submittedPassword)
  password.value = ''

  if (authenticated) {
    await router.replace(returnLocation.value)
    return
  }

  await nextTick()
  passwordInput.value?.focus()
}
</script>

<template>
  <main class="login-route">
    <section class="login-surface" aria-labelledby="login-title">
      <form class="login-card" :aria-busy="auth.isSubmitting" @submit.prevent="submit">
        <RouterLink class="return-link" :to="returnLocation">返回</RouterLink>
        <h1 id="login-title">登录</h1>

        <ProductField
          id="login-account"
          ref="accountInput"
          v-model="account"
          label="账号"
          autocomplete="username"
          autocapitalize="none"
          enterkeyhint="next"
          :spellcheck="false"
          :disabled="auth.isSubmitting"
        />

        <ProductPasswordField
          id="login-password"
          ref="passwordInput"
          v-model="password"
          label="密码"
          autocomplete="current-password"
          enterkeyhint="go"
          :disabled="auth.isSubmitting"
        />

        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>

        <ProductButton
          class="submit-button"
          native-type="submit"
          variant="primary"
          :busy="auth.isSubmitting"
        >
          {{ auth.isSubmitting ? '正在登录…' : '登录' }}
        </ProductButton>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-route {
  height: var(--workspace-viewport-h);
  min-height: 0;
  background: var(--bg);
  color: var(--text);
}

.login-surface {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  padding: var(--s-5);
  overflow: auto;
}

.login-card {
  display: grid;
  gap: var(--s-3);
  width: min(100%, 420px);
  padding: var(--s-6);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.login-card h1,
.login-error {
  margin: 0;
}

.login-card h1 {
  margin-bottom: var(--s-2);
  font-size: var(--fs-xl);
}

.return-link {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.submit-button {
  margin-top: var(--s-2);
}

.return-link:focus-visible {
  outline: var(--workspace-focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--workspace-focus-ring-offset);
}

.login-error {
  color: var(--danger);
  font-size: var(--fs-sm);
}

@media (pointer: coarse), (width <= 760px) {
  .return-link {
    min-height: var(--board-touch-target-min);
  }
}
</style>
