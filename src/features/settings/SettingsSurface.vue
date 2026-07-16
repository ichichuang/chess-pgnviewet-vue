<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import {
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
} from '@/features/board/domain/boardTypes'
import { THEME_STORAGE_KEY } from '@/theme/constants'
import { useThemeStore, useWorkspaceStore } from '@/stores'
import {
  ProductButton,
  ProductDrawer,
  ProductSelect,
  ProductSheet,
  ProductStateBanner,
  ProductSwitch,
} from '@/ui'

const props = withDefaults(
  defineProps<{
    show: boolean
    onReturnFocus?: () => void
    allowAnalysis?: boolean
  }>(),
  {
    onReturnFocus: () => undefined,
    allowAnalysis: true,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
}>()

const theme = useThemeStore()
const workspace = useWorkspaceStore()

const isNarrow = ref(false)
const failureMessage = ref<string | null>(null)
const retryAction = ref<(() => void) | null>(null)
const liveAnnouncement = ref('')

const MOBILE_BREAKPOINT = '(max-width: 560px)'

function updateNarrow(): void {
  isNarrow.value = window.matchMedia(MOBILE_BREAKPOINT).matches
}

let storageListener: ((event: StorageEvent) => void) | null = null

onMounted(() => {
  updateNarrow()
  window.addEventListener('resize', updateNarrow)

  storageListener = (event: StorageEvent): void => {
    if (event.key === THEME_STORAGE_KEY && props.show) {
      liveAnnouncement.value = '主题已在其他页面更新。'
    }
  }
  window.addEventListener('storage', storageListener)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateNarrow)
  if (storageListener) {
    window.removeEventListener('storage', storageListener)
  }
})

function close(): void {
  emit('update:show', false)
}

function onThemeChange(value: string | number | null): void {
  const preference = value === 'light' || value === 'dark' || value === 'system' ? value : null
  if (!preference) return

  const succeeded = theme.setPreference(preference)
  if (succeeded) {
    failureMessage.value = null
    retryAction.value = null
    liveAnnouncement.value = '设置已更新。'
  } else {
    failureMessage.value = '更改已应用到当前页面，但未能保存到本设备。关闭或刷新后可能恢复原值。'
    retryAction.value = () => onThemeChange(preference)
  }
}

async function applyWorkspaceChange(
  action: () => Promise<boolean>,
  retry: () => Promise<boolean>
): Promise<void> {
  const succeeded = await action()
  if (succeeded) {
    failureMessage.value = null
    retryAction.value = null
    liveAnnouncement.value = '设置已更新。'
  } else {
    failureMessage.value = '更改已应用到当前页面，但未能保存到本设备。关闭或刷新后可能恢复原值。'
    retryAction.value = () => void applyWorkspaceChange(retry, retry)
  }
}

function onShowLeftSidebarChange(value: boolean): void {
  void applyWorkspaceChange(
    () => workspace.setShowLeftSidebar(value),
    () => workspace.setShowLeftSidebar(value)
  )
}

function onShowAnalysisRegionChange(value: boolean): void {
  void applyWorkspaceChange(
    () => workspace.setShowAnalysisRegion(value),
    () => workspace.setShowAnalysisRegion(value)
  )
}

function onToolbarCollapsedChange(value: boolean): void {
  void applyWorkspaceChange(
    () => workspace.setToolbarCollapsed(value),
    () => workspace.setToolbarCollapsed(value)
  )
}

function onBoardAlignmentChange(value: string | number | null): void {
  const alignment = value === 'left' || value === 'center' || value === 'right' ? value : null
  if (!alignment) return
  void applyWorkspaceChange(
    () => workspace.setBoardAlignment(alignment),
    () => workspace.setBoardAlignment(alignment)
  )
}

function onBoardOrientationChange(value: string | number | null): void {
  const orientation = value === BOARD_ORIENTATION_WHITE || value === BOARD_ORIENTATION_BLACK ? value : null
  if (!orientation) return
  void applyWorkspaceChange(
    () => workspace.setBoardOrientation(orientation),
    () => workspace.setBoardOrientation(orientation)
  )
}

function onActiveRightTabChange(value: string | number | null): void {
  const tab =
    value === 'notation' ||
    value === 'comments' ||
    value === 'annotations' ||
    value === 'analysis'
      ? value
      : null
  if (!tab) return
  void applyWorkspaceChange(
    () => workspace.setActiveRightTab(tab),
    () => workspace.setActiveRightTab(tab)
  )
}

function onResetRightPgnHeightPx(): void {
  void applyWorkspaceChange(
    () => workspace.resetRightPgnHeightPx(),
    () => workspace.resetRightPgnHeightPx()
  )
}

function onRetry(): void {
  if (retryAction.value) {
    retryAction.value()
  }
}

const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
]

const boardAlignmentOptions = [
  { label: '靠左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '靠右', value: 'right' },
]

const boardOrientationOptions = [
  { label: '白方在下', value: BOARD_ORIENTATION_WHITE },
  { label: '黑方在下', value: BOARD_ORIENTATION_BLACK },
]

const rightTabOptions = computed(() => {
  const options = [
    { label: '棋谱', value: 'notation' },
    { label: '评论', value: 'comments' },
    { label: '标注', value: 'annotations' },
  ]
  if (props.allowAnalysis) {
    options.push({ label: '分析', value: 'analysis' })
  }
  return options
})

const effectiveActiveRightTab = computed(() => {
  const current = workspace.activeRightTab
  const allowed = rightTabOptions.value.map((option) => option.value)
  return allowed.includes(current) ? current : null
})

const canResetRightPgnHeightPx = computed(() => workspace.rightPgnHeightPx !== null)
const layoutBusy = computed(() => workspace.layoutWriteInProgress)
</script>

<template>
  <Component
    :is="isNarrow ? ProductSheet : ProductDrawer"
    :show="show"
    title="设置"
    :closable="false"
    :auto-focus="false"
    initial-focus="safe-action"
    :return-focus="onReturnFocus"
    width="var(--drawer-w)"
    height="80vh"
    @update:show="emit('update:show', $event)"
  >
    <template #header>
      <header class="settings-header">
        <div>
          <h2 id="settings-title" class="settings-title">设置</h2>
          <p id="settings-description" class="settings-description">
            调整本设备上的非敏感显示与操作偏好。
          </p>
        </div>
        <ProductButton
          variant="secondary"
          size="small"
          title="关闭设置"
          data-product-overlay-safe
          data-product-overlay-initial
          @click="close"
        >
          关闭设置
        </ProductButton>
      </header>
    </template>

    <div class="settings-body">
      <section class="settings-group" aria-labelledby="appearance-heading">
        <h3 id="appearance-heading" class="group-title">外观</h3>
        <ProductSelect
          :model-value="theme.preference"
          :options="themeOptions"
          label="主题"
          @update:model-value="onThemeChange"
        />
      </section>

      <section class="settings-group" aria-labelledby="layout-heading">
        <h3 id="layout-heading" class="group-title">工作区布局</h3>
        <ProductSwitch
          :model-value="workspace.showLeftSidebar"
          label="显示来源导航"
          :disabled="layoutBusy"
          @update:model-value="onShowLeftSidebarChange"
        />
        <ProductSwitch
          v-if="allowAnalysis"
          :model-value="workspace.showAnalysisRegion"
          label="显示分析区域"
          :disabled="layoutBusy"
          @update:model-value="onShowAnalysisRegionChange"
        />
        <ProductSwitch
          :model-value="workspace.toolbarCollapsed"
          label="收起工作区工具栏"
          :disabled="layoutBusy"
          @update:model-value="onToolbarCollapsedChange"
        />
        <ProductSelect
          :model-value="workspace.boardAlignment"
          :options="boardAlignmentOptions"
          label="棋盘位置"
          :disabled="layoutBusy"
          @update:model-value="onBoardAlignmentChange"
        />
        <ProductSelect
          :model-value="workspace.boardOrientation"
          :options="boardOrientationOptions"
          label="棋盘朝向"
          :disabled="layoutBusy"
          @update:model-value="onBoardOrientationChange"
        />
        <ProductSelect
          :model-value="effectiveActiveRightTab"
          :options="rightTabOptions"
          label="当前右侧内容"
          placeholder="选择当前右侧内容"
          :disabled="layoutBusy"
          @update:model-value="onActiveRightTabChange"
        />
        <ProductButton
          variant="secondary"
          size="small"
          :disabled="layoutBusy || !canResetRightPgnHeightPx"
          @click="onResetRightPgnHeightPx"
        >
          恢复棋谱与分析自动分区
        </ProductButton>
      </section>

      <ProductStateBanner v-if="failureMessage" status="warning" title="设置未能保存">
        <p>{{ failureMessage }}</p>
        <ProductButton variant="secondary" size="small" @click="onRetry"> 重试保存 </ProductButton>
      </ProductStateBanner>

      <div class="visually-hidden" aria-live="polite" aria-atomic="true">
        {{ liveAnnouncement }}
      </div>
    </div>

    <template #footer>
      <footer class="settings-footer">
        <ProductButton variant="secondary" @click="close">关闭设置</ProductButton>
      </footer>
    </template>
  </Component>
</template>

<style scoped>
.settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
}

.settings-title {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-lg);
}

.settings-description {
  margin: var(--s-1) 0 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.settings-body {
  display: grid;
  gap: var(--s-5);
}

.settings-group {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-4);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
}

.group-title {
  margin: 0 0 var(--s-1);
  color: var(--text);
  font-size: var(--fs-md);
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
