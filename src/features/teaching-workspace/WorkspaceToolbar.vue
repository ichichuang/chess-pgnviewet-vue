<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

import {
  ANNOTATION_COLORS,
  annotationColorToken,
  type AnnotationColorId,
  type AnnotationShapeKind,
} from '@/features/annotations/domain/annotationTypes'
import { BOARD_ORIENTATION_BLACK } from '@/features/board/domain/boardTypes'
import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import type { PgnNavigationIntent } from '@/features/pgn/pgnWorkspaceTypes'
import SettingsSurface from '@/features/settings'
import type { SettingsCapabilityContext } from '@/features/settings/settingsContext'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'
import { useAuthStore, usePgnStore, useWorkspaceStore } from '@/stores'
import { ProductButton, ProductPopover } from '@/ui'

import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const props = defineProps<{
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

const annotationTools: readonly { key: AnnotationShapeKind; label: string }[] = [
  { key: 'arrow', label: '箭头' },
  { key: 'square', label: '方框' },
  { key: 'highlight', label: '高亮' },
]

const alignments: readonly { key: 'center' | 'left' | 'right'; label: string }[] = [
  { key: 'left', label: '靠左' },
  { key: 'center', label: '居中' },
  { key: 'right', label: '靠右' },
]

const sourceSummary = computed(() => {
  return props.permissions.sourceIdentityLabel || props.permissions.sourceLabel || '尚未选择来源'
})

const currentMoveLabel = computed(() => {
  if (!pgn.hasGame) return '未载入棋局'

  const total = Math.max(0, pgn.mainline.length - 1)
  const current = Math.min(total, Math.max(0, pgn.currentNode?.ply ?? 0))
  return `${current} / ${total}`
})

function setAnnotationColor(color: AnnotationColorId): void {
  workspace.setAnnotationColor(color)
}

const rootEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)
})

function animatePlainButtonPress(event: MouseEvent): void {
  const target = event.target

  if (!(target instanceof Element)) return

  const button = target.closest('button, a')

  if (!(button instanceof HTMLElement) || button.getAttribute('aria-disabled') === 'true') return
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
    aria-label="工作区命令栏"
    @click.capture="animatePlainButtonPress"
  >
    <div class="toolbar-leading">
      <ProductButton
        size="small"
        :aria-pressed="workspace.showLeftSidebar"
        title="显示或隐藏来源导航"
        @click="workspace.toggleLeftSidebar()"
      >
        来源
      </ProductButton>
      <div class="source-summary" aria-live="polite">
        <span class="source-label">{{ permissions.sourceLabel }}</span>
        <strong>{{ sourceSummary }}</strong>
      </div>
    </div>

    <nav class="toolbar-navigation" aria-label="棋谱导航">
      <ProductButton
        size="small"
        :disabled="!pgn.canGoStart"
        title="跳到起始局面"
        @click="emit('navigate', { kind: 'start' })"
      >
        起始
      </ProductButton>
      <ProductButton
        size="small"
        :disabled="!pgn.canStepBack"
        title="上一步"
        @click="emit('navigate', { kind: 'previous' })"
      >
        上一步
      </ProductButton>
      <output class="move-progress" aria-label="当前棋步进度">{{ currentMoveLabel }}</output>
      <ProductButton
        size="small"
        variant="primary"
        :disabled="!pgn.canStepForward"
        title="下一步"
        @click="emit('navigate', { kind: 'next' })"
      >
        下一步
      </ProductButton>
      <ProductButton
        size="small"
        :disabled="!pgn.canGoEnd"
        title="跳到末尾局面"
        @click="emit('navigate', { kind: 'end' })"
      >
        末尾
      </ProductButton>
    </nav>

    <div class="toolbar-actions">
      <ProductButton
        size="small"
        :aria-pressed="workspace.boardOrientation === BOARD_ORIENTATION_BLACK"
        :disabled="!pgn.hasGame"
        title="翻转棋盘"
        @click="workspace.flipBoardOrientation()"
      >
        翻转
      </ProductButton>
      <ProductButton class="context-toggle" size="small" @click="emit('toggleContext')">
        上下文
      </ProductButton>

      <ProductPopover placement="bottom-end">
        <template #trigger>
          <ProductButton size="small" title="打开更多工作区操作">更多</ProductButton>
        </template>

        <div class="toolbar-more-menu" aria-label="更多工作区操作">
          <section class="menu-section" aria-labelledby="menu-source-title">
            <h2 id="menu-source-title">来源与文件</h2>
            <div class="menu-actions">
              <ProductButton
                size="small"
                :disabled="!props.permissions.canOpenLocalPgnAsNewSource"
                @click="emit('action', 'openLocal')"
              >
                打开 PGN
              </ProductButton>
              <ProductButton
                size="small"
                :disabled="!props.permissions.canInsertLocalPgnIntoCurrentSource"
                @click="emit('action', 'insertLocal')"
              >
                插入 PGN
              </ProductButton>
              <ProductButton
                v-if="props.permissions.canCreateEditableLocalCopy"
                size="small"
                @click="emit('action', 'createEditableLocalCopy')"
              >
                创建本地副本
              </ProductButton>
            </div>
          </section>

          <section class="menu-section" aria-labelledby="menu-board-title">
            <h2 id="menu-board-title">棋盘与布局</h2>
            <div class="menu-actions">
              <ProductButton
                v-for="alignment in alignments"
                :key="alignment.key"
                size="small"
                :aria-pressed="workspace.boardAlignment === alignment.key"
                @click="workspace.setBoardAlignment(alignment.key)"
              >
                {{ alignment.label }}
              </ProductButton>
              <ProductButton
                size="small"
                :disabled="!props.permissions.canEnterBoardEditor"
                @click="emit('action', 'enterBoardEditor')"
              >
                设置局面
              </ProductButton>
              <ProductButton
                size="small"
                :aria-pressed="workspace.showAnalysisRegion"
                :disabled="!props.permissions.canShowAnalysisPanel"
                @click="workspace.toggleAnalysisRegion()"
              >
                分析区域
              </ProductButton>
            </div>
          </section>

          <section
            v-if="props.permissions.canEditAnnotations"
            class="menu-section"
            aria-labelledby="menu-annotation-title"
          >
            <h2 id="menu-annotation-title">标注工具</h2>
            <div class="menu-actions">
              <ProductButton
                v-for="tool in annotationTools"
                :key="tool.key"
                size="small"
                :aria-pressed="workspace.annotationTool === tool.key"
                :disabled="!pgn.hasGame"
                @click="workspace.setAnnotationTool(tool.key)"
              >
                {{ tool.label }}
              </ProductButton>
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
              <ProductButton
                size="small"
                :disabled="!pgn.canUndoCurrentDrawing"
                @click="pgn.undoCurrentDrawing()"
              >
                撤销
              </ProductButton>
              <ProductButton
                size="small"
                :disabled="!pgn.canRedoCurrentDrawing"
                @click="pgn.redoCurrentDrawing()"
              >
                重做
              </ProductButton>
              <ProductButton
                size="small"
                :disabled="!pgn.hasCurrentDrawing"
                @click="emit('action', 'clearAnnotations')"
              >
                清除
              </ProductButton>
            </div>
          </section>

          <section class="menu-section" aria-labelledby="menu-product-title">
            <h2 id="menu-product-title">其他入口</h2>
            <div class="menu-links">
              <RouterLink class="menu-link" :to="{ name: 'competitions' }">公开赛事</RouterLink>
              <RouterLink v-if="!auth.isAuthenticated" class="menu-link" :to="{ name: 'login' }">
                登录
              </RouterLink>
              <button v-else class="menu-link" type="button" @click="auth.logout()">退出登录</button>
            </div>
          </section>
        </div>
      </ProductPopover>

      <ProductButton ref="settingsButtonRef" size="small" @click="settingsOpen = true">
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
  display: grid;
  flex: 0 0 var(--workspace-toolbar-h);
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--s-3);
  width: 100%;
  height: var(--workspace-toolbar-h);
  min-height: var(--workspace-toolbar-h);
  padding: 0 var(--s-3);
  overflow: hidden;
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.toolbar-leading,
.toolbar-navigation,
.toolbar-actions,
.menu-actions,
.menu-links {
  display: flex;
  align-items: center;
}

.toolbar-leading {
  justify-self: start;
  gap: var(--s-2);
  min-width: 0;
}

.source-summary {
  display: grid;
  min-width: 0;
  line-height: 1.2;
}

.source-summary strong,
.source-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-label {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.source-summary strong {
  max-width: var(--workspace-list-w);
  color: var(--text);
  font-size: var(--fs-sm);
}

.toolbar-navigation {
  justify-self: center;
  gap: var(--s-1);
  min-width: 0;
}

.move-progress {
  min-width: var(--workspace-toolbar-progress-w);
  color: var(--text-2);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.toolbar-actions {
  justify-self: end;
  gap: var(--s-1);
  min-width: 0;
}

.toolbar-more-menu {
  display: grid;
  gap: var(--s-3);
  width: var(--workspace-more-menu-w);
  max-height: var(--workspace-more-menu-max-h);
  overflow: auto;
}

.menu-section {
  display: grid;
  gap: var(--s-2);
}

.menu-section + .menu-section {
  padding-top: var(--s-3);
  border-top: var(--workspace-border-w) solid var(--border);
}

.menu-section h2 {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-weight: 600;
}

.menu-actions,
.menu-links {
  flex-wrap: wrap;
  gap: var(--s-2);
}

.menu-link,
.toolbar-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--control-h-sm);
  min-height: var(--control-h-sm);
  padding: 0 var(--s-2);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.toolbar-swatch {
  width: var(--control-h-sm);
  padding: 0;
}

.toolbar-swatch:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.menu-link:hover,
.menu-link:focus-visible {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
}

.toolbar-swatch[aria-pressed='true'] {
  border-color: var(--accent);
  box-shadow: var(--state-focus-ring);
}

@media (width <= 1200px) {
  .source-label,
  .source-summary strong {
    display: none;
  }

  .workspace-toolbar {
    gap: var(--s-2);
    padding: 0 var(--s-2);
  }
}
</style>
