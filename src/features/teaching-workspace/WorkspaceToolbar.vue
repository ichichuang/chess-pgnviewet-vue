<script setup lang="ts">
import {
  ANNOTATION_COLORS,
  annotationColorToken,
  type AnnotationColorId,
  type AnnotationShapeKind,
} from '@/features/annotations/domain/annotationTypes'
import { BOARD_ORIENTATION_BLACK } from '@/features/board/domain/boardTypes'
import SettingsSurface from '@/features/settings'
import type { SettingsCapabilityContext } from '@/features/settings/settingsContext'
import { useAuthStore, usePgnStore, useWorkspaceStore } from '@/stores'
import { ProductButton, ProductPopover } from '@/ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'
import type { PgnNavigationIntent } from '@/features/pgn/pgnWorkspaceTypes'

import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

defineProps<{
  permissions: WorkspacePermissions
  settingsContext: SettingsCapabilityContext
}>()

const emit = defineEmits<{
  action: [name: WorkspaceToolbarAction]
  navigate: [intent: PgnNavigationIntent]
  openSource: []
  toggleContext: []
}>()

const pgn = usePgnStore()
const workspace = useWorkspaceStore()
const auth = useAuthStore()
const settingsOpen = ref(false)
const settingsButtonRef = ref<InstanceType<typeof ProductButton> | null>(null)
const moreOpen = ref(false)
const sourceMenuOpen = ref(false)

const annotationTools: readonly { key: AnnotationShapeKind; label: string }[] = [
  { key: 'arrow', label: '箭头' },
  { key: 'square', label: '方框' },
  { key: 'highlight', label: '高亮' },
]

const alignments: readonly { key: 'center' | 'left' | 'right'; label: string }[] = [
  { key: 'left', label: '左' },
  { key: 'center', label: '中' },
  { key: 'right', label: '右' },
]

const movePositionText = computed(() => {
  if (!pgn.hasGame) return '— / —'

  const total = pgn.mainline.length
  if (total === 0) return '1 / 1'

  const currentIndex = pgn.mainline.findIndex((node) => node.id === pgn.currentNode?.id)
  if (currentIndex >= 0) {
    return `${currentIndex + 1} / ${total}`
  }

  const node = pgn.currentNode
  if (!node || !node.parent) return `1 / ${total}`

  return `变例 ${node.moveNumber}`
})

function setAnnotationColor(color: AnnotationColorId): void {
  workspace.setAnnotationColor(color)
}

function emitNavigate(intent: PgnNavigationIntent): void {
  emit('navigate', intent)
}

function emitAction(name: WorkspaceToolbarAction): void {
  emit('action', name)
}

function toggleSourcePanel(): void {
  if (workspace.showLeftSidebar) {
    void workspace.toggleLeftSidebar()
  } else {
    emit('openSource')
  }
}

const rootEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null

// Press feedback for plain toolbar buttons only. ProductButton instances own
// their press motion through the shared usePressMotion adapter and are skipped
// here so the two never double-animate the same element.
function animatePlainButtonPress(event: MouseEvent): void {
  const target = event.target

  if (!(target instanceof Element)) return

  const button = target.closest('button')

  if (!(button instanceof HTMLButtonElement) || button.disabled) return
  if (button.closest('.product-button')) return

  gsap.killTweensOf(button)
  context?.add(() => {
    gsap.fromTo(
      button,
      { scale: motionScalar(rootEl.value, '--workspace-motion-press-scale') },
      {
        scale: 1,
        duration: motionDuration(rootEl.value, '--workspace-motion-duration-fast'),
        ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
        overwrite: true,
        clearProps: 'transform',
      }
    )
  })
}

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)
})

onBeforeUnmount(() => {
  const targets = rootEl.value ? [rootEl.value, ...rootEl.value.querySelectorAll('*')] : []
  gsap.killTweensOf(targets)
  context?.revert()
  context = null
})
</script>

<template>
  <header
    ref="rootEl"
    class="workspace-toolbar"
    role="toolbar"
    aria-label="工作区工具栏"
    @click.capture="animatePlainButtonPress"
  >
    <div class="toolbar-leading">
      <ProductPopover
        :show="sourceMenuOpen"
        placement="bottom-start"
        @update-show="sourceMenuOpen = $event"
      >
        <template #trigger>
          <ProductButton size="small" variant="ghost" aria-haspopup="true"> 来源 </ProductButton>
        </template>

        <div class="toolbar-menu source-menu">
          <div class="menu-section">
            <span class="menu-label">当前来源</span>
            <div class="menu-source-info">
              <strong>{{ permissions.modeLabel }}</strong>
              <span>{{ permissions.sourceLabel }}</span>
              <span v-if="permissions.sourceIdentityLabel" class="source-identity">
                {{ permissions.sourceIdentityLabel }}
              </span>
            </div>
            <p
              v-if="permissions.sourceUnavailable && permissions.unavailableReason"
              class="menu-unavailable"
            >
              {{ permissions.unavailableReason }}
            </p>
          </div>

          <div class="menu-section">
            <span class="menu-label">导入与来源</span>
            <div class="menu-actions">
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!permissions.canOpenLocalPgnAsNewSource"
                @click="emitAction('openLocal'); sourceMenuOpen = false"
              >
                打开本地 PGN
              </ProductButton>
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!permissions.canInsertLocalPgnIntoCurrentSource"
                @click="emitAction('insertLocal'); sourceMenuOpen = false"
              >
                插入本地 PGN
              </ProductButton>
              <ProductButton
                v-if="permissions.canCreateEditableLocalCopy"
                size="small"
                variant="secondary"
                @click="emitAction('createEditableLocalCopy'); sourceMenuOpen = false"
              >
                创建本地可编辑副本
              </ProductButton>
            </div>
          </div>
        </div>
      </ProductPopover>

      <div v-if="permissions.hasSource" class="source-summary" :title="permissions.sourceLabel">
        <span class="source-summary-mode">{{ permissions.modeLabel }}</span>
        <span class="source-summary-name">{{ permissions.sourceLabel }}</span>
        <span v-if="permissions.sourceIdentityLabel" class="source-summary-identity">
          {{ permissions.sourceIdentityLabel }}
        </span>
      </div>
    </div>

    <nav class="toolbar-navigation" aria-label="棋谱导航">
      <ProductButton
        size="small"
        :disabled="!pgn.canGoStart"
        :title="pgn.canGoStart ? '跳到起始局面' : '已在起始局面'"
        @click="emitNavigate({ kind: 'start' })"
      >
        起始
      </ProductButton>
      <ProductButton
        size="small"
        :disabled="!pgn.canStepBack"
        :title="pgn.canStepBack ? '上一步' : '没有上一步'"
        @click="emitNavigate({ kind: 'previous' })"
      >
        上一步
      </ProductButton>

      <span class="move-position" aria-live="polite">
        <span class="move-position-label">当前着法</span>
        <strong class="move-position-value">{{ movePositionText }}</strong>
      </span>

      <ProductButton
        size="small"
        :disabled="!pgn.canStepForward"
        :title="pgn.canStepForward ? '下一步' : '没有下一步'"
        @click="emitNavigate({ kind: 'next' })"
      >
        下一步
      </ProductButton>
      <ProductButton
        size="small"
        :disabled="!pgn.canGoEnd"
        :title="pgn.canGoEnd ? '跳到末尾' : '已在末尾'"
        @click="emitNavigate({ kind: 'end' })"
      >
        末尾
      </ProductButton>
    </nav>

    <div class="toolbar-trailing">
      <ProductButton
        size="small"
        :aria-pressed="workspace.boardOrientation === BOARD_ORIENTATION_BLACK"
        :title="workspace.boardOrientation === BOARD_ORIENTATION_BLACK ? '白方在下' : '黑方在下'"
        @click="workspace.flipBoardOrientation()"
      >
        翻转
      </ProductButton>

      <ProductPopover :show="moreOpen" placement="bottom-end" @update-show="moreOpen = $event">
        <template #trigger>
          <ProductButton size="small" variant="ghost" aria-haspopup="true"> 更多 </ProductButton>
        </template>

        <div class="toolbar-menu more-menu">
          <div class="menu-section">
            <span class="menu-label">棋盘</span>
            <div class="menu-actions">
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!permissions.canEnterBoardEditor"
                @click="emitAction('enterBoardEditor'); moreOpen = false"
              >
                摆谱
              </ProductButton>
              <ProductButton
                v-for="alignment in alignments"
                :key="alignment.key"
                size="small"
                :variant="workspace.boardAlignment === alignment.key ? 'primary' : 'secondary'"
                :aria-pressed="workspace.boardAlignment === alignment.key"
                @click="workspace.setBoardAlignment(alignment.key)"
              >
                {{ alignment.label }}
              </ProductButton>
            </div>
          </div>

          <div v-if="permissions.canEditAnnotations" class="menu-section">
            <span class="menu-label">标注</span>
            <div class="menu-actions">
              <ProductButton
                v-for="tool in annotationTools"
                :key="tool.key"
                size="small"
                :variant="workspace.annotationTool === tool.key ? 'primary' : 'secondary'"
                :aria-pressed="workspace.annotationTool === tool.key"
                :disabled="!pgn.hasGame"
                @click="workspace.setAnnotationTool(tool.key)"
              >
                {{ tool.label }}
              </ProductButton>
            </div>
            <div class="menu-swatch-row">
              <button
                v-for="color in ANNOTATION_COLORS"
                :key="color"
                class="toolbar-swatch"
                type="button"
                :style="{ background: annotationColorToken(color) }"
                :aria-label="`标注颜色 ${color}`"
                :aria-pressed="workspace.annotationColor === color"
                :disabled="!pgn.hasGame"
                @click="setAnnotationColor(color)"
              />
            </div>
            <div class="menu-actions">
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!pgn.canUndoCurrentDrawing"
                @click="pgn.undoCurrentDrawing()"
              >
                撤销
              </ProductButton>
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!pgn.canRedoCurrentDrawing"
                @click="pgn.redoCurrentDrawing()"
              >
                重做
              </ProductButton>
              <ProductButton
                size="small"
                variant="secondary"
                :disabled="!pgn.hasCurrentDrawing"
                @click="emitAction('clearAnnotations')"
              >
                清除
              </ProductButton>
            </div>
          </div>

          <div class="menu-section">
            <span class="menu-label">面板</span>
            <div class="menu-actions">
              <ProductButton
                size="small"
                :variant="workspace.showLeftSidebar ? 'primary' : 'secondary'"
                :aria-pressed="workspace.showLeftSidebar"
                @click="toggleSourcePanel()"
              >
                来源导航
              </ProductButton>
              <ProductButton
                v-if="permissions.canShowAnalysisPanel"
                size="small"
                :variant="workspace.showAnalysisRegion ? 'primary' : 'secondary'"
                :aria-pressed="workspace.showAnalysisRegion"
                @click="workspace.toggleAnalysisRegion()"
              >
                分析标签
              </ProductButton>
              <ProductButton
                size="small"
                variant="secondary"
                @click="emit('toggleContext'); moreOpen = false"
              >
                上下文面板
              </ProductButton>
            </div>
          </div>

          <div class="menu-section">
            <span class="menu-label">产品入口</span>
            <div class="menu-actions">
              <RouterLink class="menu-link" :to="{ name: 'competitions' }">赛事</RouterLink>
              <RouterLink v-if="!auth.isAuthenticated" class="menu-link" :to="{ name: 'login' }">
                登录
              </RouterLink>
              <button v-else class="menu-link" type="button" @click="auth.logout()">退出</button>
            </div>
          </div>
        </div>
      </ProductPopover>

      <ProductButton
        ref="settingsButtonRef"
        size="small"
        variant="ghost"
        @click="settingsOpen = true"
      >
        设置
      </ProductButton>
    </div>

    <SettingsSurface
      v-model:show="settingsOpen"
      :context="settingsContext"
      :on-return-focus="() => settingsButtonRef?.focus()"
    />
  </header>
</template>

<style scoped>
.workspace-toolbar {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  min-width: 0;
  height: var(--control-h);
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
  white-space: nowrap;
}

.toolbar-leading,
.toolbar-trailing,
.toolbar-navigation {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.toolbar-navigation {
  flex: 1 1 auto;
  justify-content: center;
}

.source-summary {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: var(--s-2);
  min-width: 0;
  max-width: clamp(120px, 18vw, 360px);
  padding: 0 var(--s-2);
  color: var(--text);
  font-size: var(--fs-sm);
}

.source-summary-mode {
  flex: 0 0 auto;
  color: var(--text-muted);
}

.source-summary-name,
.source-summary-identity {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-summary-identity {
  color: var(--accent-strong);
}

.move-position {
  display: inline-flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 4.5rem;
  padding: 0 var(--s-2);
  text-align: center;
}

.move-position-label {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.move-position-value {
  min-width: 0;
  color: var(--text);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}

.toolbar-menu {
  display: grid;
  gap: var(--s-3);
  min-width: 220px;
  max-width: min(90vw, 360px);
  padding: var(--s-3);
}

.menu-section {
  display: grid;
  gap: var(--s-2);
}

.menu-label {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-weight: 600;
}

.menu-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: center;
}

.menu-source-info {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.menu-source-info strong {
  color: var(--text);
  font-size: var(--fs-sm);
}

.menu-source-info span {
  color: var(--text-2);
  font-size: var(--fs-xs);
}

.menu-source-info .source-identity {
  color: var(--accent-strong);
}

.menu-unavailable {
  margin: 0;
  color: var(--warning);
  font-size: var(--fs-xs);
}

.menu-swatch-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
}

.toolbar-swatch {
  display: inline-flex;
  width: var(--control-h-sm);
  min-width: var(--control-h-sm);
  height: var(--control-h-sm);
  padding: 0;
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-xs);
  cursor: pointer;
}

.toolbar-swatch:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.toolbar-swatch[aria-pressed='true'] {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.menu-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-sm);
  text-decoration: none;
  cursor: pointer;
}

.menu-link:hover {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}

/* Synchronized with --workspace-bp-tablet in tokens.css. */
@media (width <= 900px) {
  .source-summary {
    display: none;
  }
}

/* Synchronized with --workspace-bp-mobile in tokens.css. */
@media (width <= 560px) {
  .workspace-toolbar {
    gap: var(--s-1);
    padding: var(--s-2);
  }

  .toolbar-navigation {
    gap: var(--s-1);
  }

  .move-position {
    min-width: 3.5rem;
  }

  .move-position-label {
    display: none;
  }
}
</style>
