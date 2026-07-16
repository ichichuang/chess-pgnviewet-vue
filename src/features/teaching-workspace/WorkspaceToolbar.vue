<script setup lang="ts">
import {
  ANNOTATION_COLORS,
  annotationColorToken,
  type AnnotationColorId,
  type AnnotationShapeKind,
} from '@/features/annotations/domain/annotationTypes'
import { BOARD_ORIENTATION_BLACK } from '@/features/board/domain/boardTypes'
import { useAuthStore, usePgnStore, useWorkspaceStore } from '@/stores'
import SettingsSurface from '@/features/settings'
import type { SettingsCapabilityContext } from '@/features/settings/settingsContext'
import { ProductButton } from '@/ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'
import type { PgnNavigationIntent } from '@/features/pgn/pgnWorkspaceTypes'

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
  { key: 'left', label: '左' },
  { key: 'center', label: '中' },
  { key: 'right', label: '右' },
]

function setAnnotationColor(color: AnnotationColorId): void {
  workspace.setAnnotationColor(color)
}

const rootEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null

function onGroupsEnter(element: Element, done: () => void): void {
  if (!(element instanceof HTMLElement)) {
    done()
    return
  }

  context?.add(() => {
    gsap.fromTo(
      element,
      { autoAlpha: 0, height: 0 },
      {
        autoAlpha: 1,
        height: 'auto',
        duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
        ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
        overwrite: true,
        clearProps: 'height,opacity,visibility',
        onComplete: done,
      }
    )
  })
}

function onGroupsLeave(element: Element, done: () => void): void {
  if (!(element instanceof HTMLElement)) {
    done()
    return
  }

  context?.add(() => {
    gsap.to(element, {
      autoAlpha: 0,
      height: 0,
      duration: motionDuration(rootEl.value, '--workspace-motion-duration-fast'),
      ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
      overwrite: true,
      onComplete: done,
    })
  })
}

function animateToolbarState(event: MouseEvent): void {
  const target = event.target

  if (!(target instanceof Element)) return

  const button = target.closest('button')

  if (!(button instanceof HTMLButtonElement) || button.disabled) return

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
    @click.capture="animateToolbarState"
  >
    <button
      class="toolbar-collapse"
      type="button"
      :aria-label="workspace.toolbarCollapsed ? '展开工作区工具栏' : '收起工作区工具栏'"
      :aria-expanded="!workspace.toolbarCollapsed"
      @click="workspace.toggleToolbar()"
    >
      {{ workspace.toolbarCollapsed ? '展开' : '收起' }}
    </button>

    <button class="toolbar-button source-drawer-trigger" type="button" @click="emit('openSource')">
      来源
    </button>

    <Transition :css="false" @enter="onGroupsEnter" @leave="onGroupsLeave">
      <div v-if="!workspace.toolbarCollapsed" class="toolbar-groups">
        <nav class="toolbar-group" aria-label="产品入口">
          <RouterLink class="toolbar-button" :to="{ name: 'competitions' }">赛事</RouterLink>
          <RouterLink v-if="!auth.isAuthenticated" class="toolbar-button" :to="{ name: 'login' }">
            登录
          </RouterLink>
          <button v-else class="toolbar-button" type="button" @click="auth.logout()">退出</button>
        </nav>

        <section class="toolbar-group" aria-label="棋谱文件">
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
            插入
          </ProductButton>
          <ProductButton
            v-if="props.permissions.canCreateEditableLocalCopy"
            size="small"
            @click="emit('action', 'createEditableLocalCopy')"
          >
            创建本地可编辑副本
          </ProductButton>
        </section>

        <section class="toolbar-group" aria-label="棋盘控制">
          <ProductButton
            size="small"
            :aria-pressed="workspace.boardOrientation === BOARD_ORIENTATION_BLACK"
            @click="workspace.flipBoardOrientation()"
          >
            翻转
          </ProductButton>
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
            摆谱
          </ProductButton>
        </section>

        <section class="toolbar-group" aria-label="棋谱导航">
          <ProductButton
            size="small"
            :disabled="!pgn.canGoStart"
            @click="emit('navigate', { kind: 'start' })"
          >
            起始
          </ProductButton>
          <ProductButton
            size="small"
            :disabled="!pgn.canStepBack"
            @click="emit('navigate', { kind: 'previous' })"
          >
            上一步
          </ProductButton>
          <ProductButton
            size="small"
            :disabled="!pgn.canStepForward"
            @click="emit('navigate', { kind: 'next' })"
          >
            下一步
          </ProductButton>
          <ProductButton
            size="small"
            :disabled="!pgn.canGoEnd"
            @click="emit('navigate', { kind: 'end' })"
          >
            末尾
          </ProductButton>
        </section>

        <section
          v-if="props.permissions.canEditAnnotations"
          class="toolbar-group"
          aria-label="标注工具"
        >
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
        </section>

        <section class="toolbar-group" aria-label="面板控制">
          <ProductButton
            size="small"
            :aria-pressed="workspace.showLeftSidebar"
            @click="workspace.toggleLeftSidebar()"
          >
            列表
          </ProductButton>
          <ProductButton
            v-if="props.permissions.canShowAnalysisPanel"
            size="small"
            :aria-pressed="workspace.showAnalysisRegion"
            @click="workspace.toggleAnalysisRegion()"
          >
            分析
          </ProductButton>
          <ProductButton class="context-toggle" size="small" @click="emit('toggleContext')">
            上下文
          </ProductButton>
          <ProductButton ref="settingsButtonRef" size="small" @click="settingsOpen = true">
            设置
          </ProductButton>
        </section>
      </div>
    </Transition>

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
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  padding: var(--s-2);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.toolbar-collapse,
.source-drawer-trigger,
.context-toggle {
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
  cursor: pointer;
}

.source-drawer-trigger {
  display: none;
}

.toolbar-groups {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  overflow: hidden;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-width: 0;
  padding: var(--s-1);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.toolbar-button,
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
  cursor: pointer;
}

a.toolbar-button {
  text-decoration: none;
}

.toolbar-swatch {
  width: var(--control-h-sm);
  min-width: var(--control-h-sm);
  padding: 0;
}

.toolbar-button:disabled,
.toolbar-swatch:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.toolbar-button[aria-pressed='true'],
.toolbar-swatch[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

@media (width <= 900px) {
  .source-drawer-trigger {
    display: inline-flex;
  }
}

@media (width <= 560px) {
  .workspace-toolbar {
    align-items: flex-start;
  }

  .toolbar-groups {
    overflow: auto;
    scrollbar-gutter: stable;
  }
}
</style>
