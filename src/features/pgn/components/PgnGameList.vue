<script setup lang="ts">
import type { PgnWorkspaceAction } from '@/features/pgn/pgnWorkspaceTypes'

import { usePgnStore } from '@/stores'

const emit = defineEmits<{
  action: [name: PgnWorkspaceAction]
}>()

const props = defineProps<{
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
}>()

const store = usePgnStore()

function openLocal() {
  emit('action', 'openLocal')
}

function insertLocal() {
  emit('action', 'insertLocal')
}
</script>

<template>
  <aside class="pgn-list" data-p1c-pgn-list>
    <header class="pgn-list-head">
      <h2>棋谱列表</h2>
      <span>{{ store.total }} 盘</span>
    </header>

    <div class="pgn-list-actions">
      <button type="button" :disabled="!props.canOpenLocalPgnAsNewSource" @click="openLocal">
        打开 PGN
      </button>
      <button
        type="button"
        :disabled="!props.canInsertLocalPgnIntoCurrentSource"
        @click="insertLocal"
      >
        插入
      </button>
    </div>

    <input
      v-model="store.searchKey"
      class="pgn-list-search"
      type="search"
      placeholder="搜索标题 / 棋手 / 棋步"
      @input="store.setPage(0)"
    />

    <ul class="pgn-list-items">
      <li
        v-for="item in store.pagedItems"
        :key="`${store.items.indexOf(item)}-${item.tree?.root.id ?? 'empty'}`"
        class="pgn-list-item"
        :class="{ active: store.items.indexOf(item) === store.selectedIndex }"
      >
        <button type="button" @click="store.selectItem(store.items.indexOf(item))">
          <span class="pgn-list-title">{{ store.titleFor(item, store.items.indexOf(item)) }}</span>
          <span class="pgn-list-players"> {{ item.White || '?' }} vs {{ item.Black || '?' }} </span>
          <span class="pgn-list-meta">
            {{ item.Result || '*' }}
            <template v-if="item.tree?.fromFen"> · FEN</template>
          </span>
        </button>
      </li>
      <li v-if="store.pagedItems.length === 0" class="pgn-list-empty">暂无棋谱</li>
    </ul>

    <footer class="pgn-list-pager">
      <button type="button" :disabled="store.page === 0" @click="store.setPage(store.page - 1)">
        上一页
      </button>
      <span>{{ store.page + 1 }} / {{ store.pageTotal }}</span>
      <button
        type="button"
        :disabled="store.page >= store.pageTotal - 1"
        @click="store.setPage(store.page + 1)"
      >
        下一页
      </button>
    </footer>
  </aside>
</template>

<style scoped>
.pgn-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--surface);
  color: var(--text);
}

.pgn-list-head,
.pgn-list-actions,
.pgn-list-pager {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.pgn-list-head {
  justify-content: space-between;
}

.pgn-list-head h2 {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-lg);
  font-weight: 700;
}

.pgn-list-head span,
.pgn-list-pager,
.pgn-list-players,
.pgn-list-meta,
.pgn-list-empty {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.pgn-list-actions button,
.pgn-list-pager button {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.pgn-list-search {
  flex: 0 0 auto;
  width: calc(100% - var(--s-8));
  min-height: var(--control-h-sm);
  margin: var(--s-3) var(--s-4);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
}

.pgn-list-search:focus {
  border-color: var(--border-focus);
  background: var(--surface);
}

.pgn-list-items {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin: 0;
  padding: 0 var(--s-4) var(--s-3);
  overflow: auto;
  scrollbar-gutter: stable;
  list-style: none;
}

.pgn-list-item button {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: var(--s-1);
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pgn-list-title,
.pgn-list-players {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pgn-list-title {
  color: var(--text);
  font-weight: 700;
}

.pgn-list-empty {
  padding: var(--s-6) var(--s-3);
  text-align: center;
}

.pgn-list-pager {
  justify-content: space-between;
  border-top: var(--workspace-border-w) solid var(--border);
  border-bottom: 0;
  background: var(--surface-2);
}

.pgn-list-actions button:disabled,
.pgn-list-pager button:disabled {
  cursor: default;
  opacity: 0.5;
}

.pgn-list-item.active button,
.pgn-list-item button:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.pgn-list-actions button:hover:not(:disabled),
.pgn-list-pager button:hover:not(:disabled) {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}
</style>
