<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import {
  subscribePrivateAuthUiLoss,
} from '@/api/privateAuthLifecycle'
import { loginRouteFor, safeAuthReturnPath } from '@/router'
import ProductButton from '@/ui/ProductButton.vue'
import ProductDialog from '@/ui/ProductDialog.vue'

import {
  provideProductFeedback,
  type ProductConfirmationRequest,
  type ProductFeedbackApi,
  type ProductLoginRequiredEvent,
  type ProductRecoverableMessageEvent,
  type ProductRecoverableMessageKind,
  type ProductSessionExpiredEvent,
} from './productFeedback'

type RecoverableMessageVariant = 'success' | 'warning' | 'error' | 'info'

const recoverableMessageCopy: Record<
  ProductRecoverableMessageKind,
  { variant: RecoverableMessageVariant; content: string }
> = {
  'settings-saved': { variant: 'success', content: '设置已更新。' },
  'settings-save-failed': {
    variant: 'warning',
    content: '更改已应用到当前页面，但未能保存到本设备。',
  },
  'action-completed': { variant: 'success', content: '操作已完成。' },
  'content-temporarily-unavailable': {
    variant: 'warning',
    content: '当前内容暂时无法打开。',
  },
}

const message = useMessage()
const route = useRoute()
const router = useRouter()

const loginRequiredOpen = ref(false)
const loginRequiredReturnPath = ref('/')
const sessionExpiredOpen = ref(false)
const sessionExpiredReturnPath = ref('/')
const confirmationOpen = ref(false)
const activeConfirmation = ref<ProductConfirmationRequest | null>(null)
let confirmationResolver: ((accepted: boolean) => void) | null = null
let confirmationSettling = false

const confirmationTitle = computed(() => activeConfirmation.value?.title ?? '')
const confirmationDescription = computed(() => activeConfirmation.value?.description ?? '')
const confirmationConfirmText = computed(() => activeConfirmation.value?.confirmText ?? '确认')
const confirmationCancelText = computed(() => activeConfirmation.value?.cancelText ?? '取消')
const confirmationDangerous = computed(() => activeConfirmation.value?.dangerous ?? false)
const confirmationReturnFocus = computed(() => activeConfirmation.value?.returnFocus)

function currentSafeReturnPath(requested?: string): string {
  return safeAuthReturnPath(requested) ?? safeAuthReturnPath(route.fullPath) ?? '/'
}

function showRecoverableMessage(event: ProductRecoverableMessageEvent): void {
  const copy = recoverableMessageCopy[event.kind]
  message[copy.variant](copy.content)
}

function showLoginRequired(event: ProductLoginRequiredEvent = {}): void {
  loginRequiredReturnPath.value = currentSafeReturnPath(event.returnPath)
  loginRequiredOpen.value = true
}

function showSessionExpired(event: ProductSessionExpiredEvent = {}): void {
  if (route.name === 'login') return
  loginRequiredOpen.value = false
  sessionExpiredReturnPath.value = currentSafeReturnPath(event.returnPath)
  sessionExpiredOpen.value = true
}

function goToLogin(reason: 'expired' | 'required'): void {
  const returnPath =
    reason === 'expired' ? sessionExpiredReturnPath.value : loginRequiredReturnPath.value
  loginRequiredOpen.value = false
  sessionExpiredOpen.value = false
  void router.push(loginRouteFor(returnPath, reason))
}

function requestConfirmation(request: ProductConfirmationRequest): Promise<boolean> {
  if (confirmationResolver || confirmationSettling) {
    return Promise.resolve(false)
  }

  activeConfirmation.value = request
  confirmationOpen.value = true
  return new Promise((resolve) => {
    confirmationResolver = resolve
  })
}

function settleConfirmation(accepted: boolean): void {
  const resolve = confirmationResolver
  if (!resolve) return

  confirmationResolver = null
  confirmationSettling = true
  confirmationOpen.value = false
  resolve(accepted)
  void nextTick(() => {
    if (!confirmationOpen.value) activeConfirmation.value = null
    confirmationSettling = false
  })
}

const api: ProductFeedbackApi = {
  showRecoverableMessage,
  showLoginRequired,
  showSessionExpired,
  requestConfirmation,
}

provideProductFeedback(api)

const unsubscribeAuthLoss = subscribePrivateAuthUiLoss(() => {
  showSessionExpired({ returnPath: route.fullPath })
})

onBeforeUnmount(() => {
  unsubscribeAuthLoss()
  confirmationResolver?.(false)
  confirmationResolver = null
})
</script>

<template>
  <slot />

  <ProductDialog
    v-model:show="loginRequiredOpen"
    title="需要登录"
    description="登录后才能继续此操作。当前公开内容和本地教学内容不会被清除。"
    initial-focus="safe-action"
  >
    <template #footer>
      <ProductButton
        variant="secondary"
        data-product-overlay-safe
        data-product-overlay-initial
        @click="loginRequiredOpen = false"
      >
        暂不登录
      </ProductButton>
      <ProductButton variant="primary" @click="goToLogin('required')">去登录</ProductButton>
    </template>
  </ProductDialog>

  <ProductDialog
    v-model:show="sessionExpiredOpen"
    title="登录已过期"
    description="当前账户会话已结束。受保护内容已停止更新，公开赛事和本地教学内容仍保留。"
    initial-focus="safe-action"
  >
    <template #footer>
      <ProductButton
        variant="secondary"
        data-product-overlay-safe
        data-product-overlay-initial
        @click="sessionExpiredOpen = false"
      >
        继续使用公开内容
      </ProductButton>
      <ProductButton variant="primary" @click="goToLogin('expired')">重新登录</ProductButton>
    </template>
  </ProductDialog>

  <ProductDialog
    :show="confirmationOpen"
    :title="confirmationTitle"
    :description="confirmationDescription"
    :role="confirmationDangerous ? 'alertdialog' : 'dialog'"
    :closable="!confirmationDangerous"
    :mask-closable="!confirmationDangerous"
    :return-focus="confirmationReturnFocus"
    initial-focus="safe-action"
    @update:show="(show) => !show && settleConfirmation(false)"
  >
    <template #footer>
      <ProductButton
        variant="secondary"
        data-product-overlay-safe
        data-product-overlay-initial
        @click="settleConfirmation(false)"
      >
        {{ confirmationCancelText }}
      </ProductButton>
      <ProductButton
        :variant="confirmationDangerous ? 'danger' : 'primary'"
        :data-product-overlay-danger="confirmationDangerous ? 'true' : undefined"
        @click="settleConfirmation(true)"
      >
        {{ confirmationConfirmText }}
      </ProductButton>
    </template>
  </ProductDialog>
</template>
