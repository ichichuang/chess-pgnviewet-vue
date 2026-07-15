<!--
Layout contract: docs/design/pages/LOGIN_PAGE_SPEC.zh-CN.md
- Page height: 100dvh
- Shell: independent LoginShell, not ProductRouteShell
- Scroll owner: login-surface when content exceeds viewport
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
  ProductStateBanner,
} from '@/ui'
import type { ComponentPublicInstance } from 'vue'

type FieldError = { account?: string; password?: string }

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const account = ref('')
const password = ref('')
const validationError = ref<FieldError>({})
const accountInput = ref<ComponentPublicInstance<{ focus: () => void }> | null>(null)
const passwordInput = ref<ComponentPublicInstance<{ focus: () => void }> | null>(null)
const submitButton = ref<ComponentPublicInstance<{ focus: () => void }> | null>(null)

const returnPath = computed(() => safeAuthReturnPath(route.query.return))
const hasReturn = computed(() => returnPath.value !== null)
const sessionExpired = computed(() => route.query.reason === 'expired')

const taskDescription = computed(() => {
  if (sessionExpired.value) return ''
  return hasReturn.value ? '登录后继续使用受保护内容。' : '登录后继续使用开赛了。'
})

const returnLocation = computed<RouteLocationRaw>(() =>
  returnPath.value ? returnPath.value : { name: 'competitions' }
)

const returnLabel = computed(() => (returnPath.value ? '返回原页面' : '返回赛事'))

const isServiceUnavailable = computed(() => {
  if (auth.isSubmitting || auth.lastErrorKind === null) return false
  return auth.lastErrorKind !== 'auth-required'
})

const isInvalidCredentials = computed(() => auth.lastErrorKind === 'auth-required')

onMounted(() => {
  void nextTick(() => {
    accountInput.value?.focus()
  })
})

async function submit(): Promise<void> {
  if (auth.isSubmitting) return

  validationError.value = {}
  const normalizedAccount = account.value.trim()

  if (!normalizedAccount) {
    validationError.value = { account: '请输入账号。' }
    await nextTick()
    accountInput.value?.focus()
    return
  }

  if (!password.value) {
    validationError.value = { password: '请输入密码。' }
    await nextTick()
    passwordInput.value?.focus()
    return
  }

  await nextTick()
  submitButton.value?.focus()

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

function navigateReturn(): void {
  void router.replace(returnLocation.value)
}
</script>

<template>
  <main class="login-route">
    <section class="login-surface" aria-labelledby="login-title">
      <form class="login-card" :aria-busy="auth.isSubmitting" @submit.prevent="submit">
        <header class="login-header">
          <span class="login-product">开赛了</span>
          <h1 id="login-title" class="login-title">登录</h1>
          <p v-if="taskDescription" class="login-description">{{ taskDescription }}</p>
        </header>

        <ProductStateBanner v-if="sessionExpired" status="warning" title="登录已过期">
          当前账户会话已结束。受保护内容已停止更新，公开赛事和本地教学内容仍保留。
        </ProductStateBanner>

        <ProductStateBanner v-if="isServiceUnavailable" status="error" title="登录服务暂不可用">
          当前无法完成登录。请稍后重试，或返回公开内容。
        </ProductStateBanner>

        <ProductField
          id="login-account"
          ref="accountInput"
          v-model="account"
          label="账号"
          placeholder="请输入账号"
          autocomplete="username"
          autocapitalize="none"
          enterkeyhint="next"
          :spellcheck="false"
          :disabled="auth.isSubmitting"
          :error="validationError.account"
        />

        <ProductPasswordField
          id="login-password"
          ref="passwordInput"
          v-model="password"
          label="密码"
          placeholder="请输入密码"
          autocomplete="current-password"
          enterkeyhint="go"
          :disabled="auth.isSubmitting"
          :error="validationError.password"
        />

        <p v-if="isInvalidCredentials" class="login-error" role="alert">账号或密码错误。</p>

        <ProductButton
          ref="submitButton"
          class="submit-button"
          native-type="submit"
          variant="primary"
          :busy="auth.isSubmitting"
        >
          {{ auth.isSubmitting ? '正在登录…' : '登录' }}
        </ProductButton>

        <ProductButton variant="secondary" :disabled="auth.isSubmitting" @click="navigateReturn">
          {{ returnLabel }}
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
  scrollbar-gutter: stable;
}

.login-card {
  display: grid;
  gap: var(--s-3);
  width: min(100%, 420px);
  padding: var(--s-6);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.login-header {
  display: grid;
  gap: var(--s-1);
  margin-bottom: var(--s-2);
}

.login-product {
  color: var(--accent-strong);
  font-size: var(--fs-sm);
  font-weight: 600;
}

.login-title,
.login-description,
.login-error {
  margin: 0;
}

.login-title {
  font-size: var(--fs-xl);
}

.login-description {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.submit-button {
  margin-top: var(--s-2);
}

.login-error {
  color: var(--danger);
  font-size: var(--fs-sm);
}

@media (pointer: coarse), (width <= 760px) {
  .login-surface {
    padding: var(--s-4);
  }

  .login-card {
    padding: var(--s-5);
  }
}
</style>
