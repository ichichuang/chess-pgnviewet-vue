<script setup lang="ts">
import { computed } from 'vue'

import { pieceImg } from './domain/pieceAssets'

const props = defineProps({
  pending: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['resolve', 'cancel'])
const pieces = ['q', 'r', 'b', 'n']

const pieceLetters = computed(() => {
  const color = props.pending?.color === 'b' ? 'b' : 'w'

  return pieces.map((piece) => (color === 'w' ? piece.toUpperCase() : piece))
})
</script>

<template>
  <div v-if="pending?.from" class="promotion-mask" role="presentation">
    <section
      class="promotion-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-title"
    >
      <h2 id="promotion-title">选择升变棋子</h2>
      <div class="promotion-row" role="group" aria-label="升变棋子">
        <button
          v-for="(letter, index) in pieceLetters"
          :key="letter"
          class="promotion-piece"
          type="button"
          :aria-label="`升变为${letter}`"
          @click="emit('resolve', pieces[index])"
        >
          <img :src="pieceImg(letter)" alt="" draggable="false" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.promotion-mask {
  position: absolute;
  inset: 0;
  z-index: var(--board-promotion-z);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--board-promotion-backdrop);
}

.promotion-card {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.promotion-card h2 {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  text-align: center;
}

.promotion-row {
  display: flex;
  gap: var(--s-2);
}

.promotion-piece {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--board-promotion-piece-size);
  height: var(--board-promotion-piece-size);
  min-width: var(--board-touch-target-min);
  min-height: var(--board-touch-target-min);
  padding: var(--s-1);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
  cursor: pointer;
  transition:
    background var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.promotion-piece:hover {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.promotion-piece img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
