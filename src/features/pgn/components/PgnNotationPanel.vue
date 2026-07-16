<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { buildMoveRows } from '@/features/pgn/domain/moveRows'
import type { PgnWorkspaceAction } from '@/features/pgn/pgnWorkspaceTypes'
import { usePgnStore } from '@/stores'

const emit = defineEmits<{
  action: [name: Extract<PgnWorkspaceAction, 'openLocal'>]
}>()

const props = defineProps<{
  canOpenLocalPgnAsNewSource: boolean
}>()

const store = usePgnStore()
const expanded = ref(emptyExpanded())
const movesScroller = ref()

const item = computed(() => store.selectedItem)
const rootId = computed(() => item.value?.tree?.root.id ?? null)
const rows = computed(() => buildMoveRows(item.value?.tree?.root, expanded.value))
const currentNodeId = computed(() => store.currentNode?.id ?? null)
const displayedHeaders = computed(() => {
  const tags = item.value?.tags ?? {}
  const names = ['Event', 'Site', 'Date', 'Round', 'Wh\u0069te', 'Bl\u0061ck', 'Result', 'FEN']

  return names
    .filter((name) => tags[name])
    .map((name) => ({
      name,
      value: tags[name],
    }))
})

watch(rootId, () => {
  expanded.value = emptyExpanded()
})

watch(
  currentNodeId,
  async (nodeId) => {
    if (nodeId == null) {
      return
    }

    revealCurrentPath()
    await nextTick()

    const scroller = movesScroller.value
    const active = scroller?.querySelector(`[data-pgn-node-id="${nodeId}"]`)

    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  },
  { flush: 'post' }
)

function rowStyle(row = { indentLevel: 0 }) {
  return {
    '--pgn-indent-depth': String(row.indentLevel),
  }
}

function emptyExpanded() {
  const values = new Set([0])
  values.clear()
  return values
}

function toggleVariation(id = -1) {
  const next = new Set(expanded.value)

  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }

  expanded.value = next
}

function revealCurrentPath() {
  const next = new Set(expanded.value)

  for (const node of store.activePath) {
    const parent = node.parent

    if (!parent || parent.children[0] === node) {
      continue
    }

    const mainlineSibling = parent.children[0]

    if (mainlineSibling) {
      next.add(mainlineSibling.id)
    }
  }

  expanded.value = next
}

function nagLabel(nag = '') {
  switch (nag) {
    case '$1':
      return '!'
    case '$2':
      return '?'
    case '$3':
      return '!!'
    case '$4':
      return '??'
    case '$5':
      return '!?'
    case '$6':
      return '?!'
    default:
      return nag
  }
}

function nodeComments(node = { annotation: { plainComments: [''] } }) {
  return node.annotation.plainComments.filter((comment) => comment.trim() !== '')
}

function openLocal() {
  emit('action', 'openLocal')
}
</script>

<template>
  <section class="pgn-panel" data-p1c-pgn-panel>
    <header class="pgn-panel-toolbar" role="toolbar" aria-label="PGN 导航">
      <button
        class="pgn-control"
        type="button"
        :disabled="!props.canOpenLocalPgnAsNewSource"
        @click="openLocal"
      >
        打开 PGN
      </button>
      <button
        class="pgn-control"
        type="button"
        :disabled="!store.canGoStart"
        @click="store.goToStart()"
      >
        起始
      </button>
      <button
        class="pgn-control"
        type="button"
        :disabled="!store.canStepBack"
        @click="store.stepBack()"
      >
        上一步
      </button>
      <button
        class="pgn-control"
        type="button"
        :disabled="!store.canStepForward"
        @click="store.stepForward()"
      >
        下一步
      </button>
      <button
        class="pgn-control"
        type="button"
        :disabled="!store.canGoEnd"
        @click="store.goToEnd()"
      >
        末尾
      </button>
    </header>

    <section v-if="store.pendingBranch" class="pgn-panel-branch" data-pgn-branch-choice>
      <span>{{ store.pendingBranch.san }}</span>
      <button class="pgn-control" type="button" @click="store.resolveBranch(false)">
        作为变例
      </button>
      <button class="pgn-control" type="button" @click="store.resolveBranch(true)">作为主线</button>
      <button class="pgn-control" type="button" @click="store.cancelBranch()">取消</button>
    </section>

    <section v-if="store.lastError" class="pgn-panel-error" role="status">
      {{ store.lastError }}
    </section>

    <section v-if="!item" class="pgn-panel-empty">暂无棋谱</section>

    <template v-else>
      <section class="pgn-panel-headers" aria-label="PGN 头信息">
        <h2>{{ store.titleFor(item, store.selectedIndex) }}</h2>
        <dl>
          <template v-for="header in displayedHeaders" :key="header.name">
            <dt>{{ header.name }}</dt>
            <dd>{{ header.value }}</dd>
          </template>
        </dl>
      </section>

      <section ref="movesScroller" class="pgn-panel-moves" aria-label="PGN 着法">
        <button
          type="button"
          class="pgn-root"
          :class="{ active: currentNodeId === rootId }"
          :data-pgn-node-id="rootId"
          :data-pgn-node-fen="item.tree?.root.fen"
          @click="store.goToStart()"
        >
          初始局面
        </button>

        <div
          v-for="row in rows"
          :key="row.key"
          class="pgn-row"
          :class="{ variation: row.isVariation }"
          :style="rowStyle(row)"
        >
          <span class="pgn-row-number">{{ row.moveNumber }}.</span>

          <div class="pgn-row-move">
            <button
              v-if="row.whiteChip"
              type="button"
              class="pgn-chip"
              :class="{ active: currentNodeId === row.whiteChip.node.id }"
              :data-pgn-node-id="row.whiteChip.node.id"
              :data-pgn-node-fen="row.whiteChip.node.fen"
              @click="store.selectNode(row.whiteChip.node.id)"
            >
              <span>{{ row.whiteChip.san }}</span>
              <span v-for="nag in row.whiteChip.node.nags" :key="nag" class="pgn-chip-nag">
                {{ nagLabel(nag) }}
              </span>
            </button>
            <button
              v-if="row.whiteChip?.caretId != null"
              type="button"
              class="pgn-branch-toggle"
              :aria-expanded="expanded.has(row.whiteChip.caretId)"
              @click="toggleVariation(row.whiteChip.caretId)"
            >
              {{ expanded.has(row.whiteChip.caretId) ? '−' : '+' }}
            </button>
            <template v-if="row.whiteChip">
              <p
                v-for="comment in nodeComments(row.whiteChip.node)"
                :key="`${row.whiteChip.node.id}-${comment}`"
                class="pgn-row-comment"
              >
                {{ comment }}
              </p>
            </template>
          </div>

          <div class="pgn-row-move">
            <button
              v-if="row.blackChip"
              type="button"
              class="pgn-chip"
              :class="{ active: currentNodeId === row.blackChip.node.id }"
              :data-pgn-node-id="row.blackChip.node.id"
              :data-pgn-node-fen="row.blackChip.node.fen"
              @click="store.selectNode(row.blackChip.node.id)"
            >
              <span>{{ row.blackChip.san }}</span>
              <span v-for="nag in row.blackChip.node.nags" :key="nag" class="pgn-chip-nag">
                {{ nagLabel(nag) }}
              </span>
            </button>
            <button
              v-if="row.blackChip?.caretId != null"
              type="button"
              class="pgn-branch-toggle"
              :aria-expanded="expanded.has(row.blackChip.caretId)"
              @click="toggleVariation(row.blackChip.caretId)"
            >
              {{ expanded.has(row.blackChip.caretId) ? '−' : '+' }}
            </button>
            <template v-if="row.blackChip">
              <p
                v-for="comment in nodeComments(row.blackChip.node)"
                :key="`${row.blackChip.node.id}-${comment}`"
                class="pgn-row-comment"
              >
                {{ comment }}
              </p>
            </template>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.pgn-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--surface);
  color: var(--text);
}

.pgn-panel-toolbar,
.pgn-panel-branch,
.pgn-panel-error,
.pgn-panel-headers {
  flex: 0 0 auto;
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.pgn-panel-toolbar,
.pgn-panel-branch {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3);
}

.pgn-control,
.pgn-root,
.pgn-chip,
.pgn-branch-toggle {
  min-height: var(--control-h-sm);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.pgn-control,
.pgn-root {
  padding: 0 var(--s-3);
}

.pgn-control:disabled {
  cursor: default;
  opacity: 0.5;
}

.pgn-panel-branch {
  background: var(--accent-bg);
}

.pgn-panel-branch span {
  color: var(--accent-strong);
  font-weight: 700;
}

.pgn-panel-error {
  padding: var(--s-3);
  color: var(--danger);
  background: var(--surface-2);
  font-size: var(--fs-sm);
}

.pgn-panel-empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  color: var(--text-muted);
}

.pgn-panel-headers {
  padding: var(--s-3);
}

.pgn-panel-headers h2 {
  margin: 0 0 var(--s-2);
  color: var(--text);
  font-size: var(--fs-lg);
  line-height: 1.25;
}

.pgn-panel-headers dl {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--s-1) var(--s-3);
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.pgn-panel-headers dt,
.pgn-panel-headers dd {
  min-width: 0;
  margin: 0;
}

.pgn-panel-headers dd {
  overflow: hidden;
  color: var(--text-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pgn-panel-moves {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--s-3);
  overflow: auto;
  scrollbar-gutter: stable;
}

.pgn-root {
  margin-bottom: var(--s-2);
}

.pgn-row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-2);
  align-items: start;
  margin-left: calc(var(--pgn-indent-depth) * var(--s-5));
  padding: var(--s-1) 0;
}

.pgn-row.variation {
  border-left: var(--workspace-border-w) solid var(--accent-line);
  padding-left: var(--s-2);
}

.pgn-row-number {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  line-height: var(--control-h-sm);
}

.pgn-row-move {
  min-width: 0;
}

.pgn-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: var(--s-1);
  padding: 0 var(--s-2);
  font-weight: 700;
}

.pgn-chip-nag {
  color: var(--warning);
  font-size: var(--fs-sm);
}

.pgn-branch-toggle {
  min-width: var(--control-h-sm);
  margin-left: var(--s-1);
  padding: 0;
  font-weight: 700;
}

.pgn-root.active,
.pgn-chip.active {
  border-color: var(--accent);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.pgn-control:hover:not(:disabled),
.pgn-root:hover:not(.active),
.pgn-chip:hover:not(.active),
.pgn-branch-toggle:hover {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}

.pgn-row-comment {
  margin: var(--s-1) 0 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  line-height: 1.45;
}

@media (width <= 560px) {
  .pgn-row {
    grid-template-columns: max-content minmax(0, 1fr);
  }

  .pgn-row-move:last-child {
    grid-column: 2;
  }
}
</style>
