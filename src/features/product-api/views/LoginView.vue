<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh
- Module: centered account login form
- Scroll owner: login surface
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { safeAuthReturnPath } from '@/router'
import { useAuthStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const account = ref('')
const password = ref('')
const passwordVisible = ref(false)
const validationError = ref('')
const accountInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

const errorMessage = computed(() => validationError.value || auth.lastError || '')
const returnPath = computed(() => safeAuthReturnPath(route.query.return))
const returnLocation = computed<RouteLocationRaw>(() =>
  returnPath.value ? returnPath.value : { name: 'competitions' }
)

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

        <label class="field-label" for="login-account">账号</label>
        <input
          id="login-account"
          ref="accountInput"
          v-model="account"
          name="username"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          enterkeyhint="next"
          spellcheck="false"
          :disabled="auth.isSubmitting"
        />

        <label class="field-label" for="login-password">密码</label>
        <div class="password-field">
          <input
            id="login-password"
            ref="passwordInput"
            v-model="password"
            name="password"
            :type="passwordVisible ? 'text' : 'password'"
            autocomplete="current-password"
            enterkeyhint="go"
            :disabled="auth.isSubmitting"
          />
          <button
            class="visibility-button"
            type="button"
            aria-controls="login-password"
            :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
            :aria-pressed="passwordVisible"
            :disabled="auth.isSubmitting"
            @click="passwordVisible = !passwordVisible"
          >
            {{ passwordVisible ? '隐藏' : '显示' }}
          </button>
        </div>

        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>

        <button class="submit-button" type="submit" :disabled="auth.isSubmitting">
          {{ auth.isSubmitting ? '正在登录…' : '登录' }}
        </button>
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

.field-label {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.login-card input,
.login-card button,
.return-link {
  min-height: var(--control-h);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  font: inherit;
}

.login-card input {
  width: 100%;
  min-width: 0;
  padding: 0 var(--s-3);
  background: var(--surface-2);
  color: var(--text);
}

.password-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-2);
}

.visibility-button,
.submit-button,
.return-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--s-3);
  cursor: pointer;
}

.visibility-button,
.return-link {
  background: var(--surface-2);
  color: var(--text);
}

.return-link {
  justify-self: start;
  color: var(--text);
  text-decoration: none;
}

.submit-button {
  margin-top: var(--s-2);
  background: var(--accent);
  color: var(--text-inverse);
}

.login-card button:disabled,
.login-card input:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.login-error {
  color: var(--danger);
  font-size: var(--fs-sm);
}

.login-card input:focus-visible,
.login-card button:focus-visible,
.return-link:focus-visible {
  outline: var(--workspace-focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--workspace-focus-ring-offset);
}

@media (pointer: coarse), (width <= 760px) {
  .login-card input,
  .login-card button,
  .return-link {
    min-height: var(--board-touch-target-min);
  }
}
</style>
