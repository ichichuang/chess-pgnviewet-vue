<script setup lang="ts">
import { BOARD_COLOR_WHITE, BOARD_ORIENTATION_WHITE } from './domain/boardTypes'
import { useBoardView } from './useBoardView'

const props = defineProps({
  fen: { type: String, required: true },
  lastMove: { type: Array, default: undefined },
  orientation: { type: String, default: BOARD_ORIENTATION_WHITE },
  turnColor: { type: String, default: BOARD_COLOR_WHITE },
  dests: { type: Map, default: () => new Map() },
  check: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['move', 'interaction-active'])

const {
  activeDestMarkers,
  ariaLabel,
  CAPTURE_OUTLINE_RADIUS,
  CAPTURE_RING_RADIUS,
  cells,
  checkMarker,
  draggingFrom,
  files,
  focusedMarker,
  ghost,
  hoverSquare,
  onCancel,
  onDown,
  onKeydown,
  onLeave,
  onMove,
  onUp,
  overlayOn,
  pieces,
  PIECE_UNIT,
  pieceImg,
  QUIET_MOVE_RADIUS,
  ranks,
  selectedMarker,
  squarePx,
  stateOverlays,
  wrap,
} = useBoardView(props, emit)
</script>

<template>
  <div class="board-view" data-p1b-board-view>
    <div class="board-frame">
      <div class="coords files files-top" aria-hidden="true">
        <span v-for="file in files" :key="`top-${file}`">{{ file }}</span>
      </div>
      <div class="coords ranks ranks-left" aria-hidden="true">
        <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
      </div>
      <div
        ref="wrap"
        class="cg-wrap"
        role="grid"
        tabindex="0"
        :aria-label="ariaLabel"
        @keydown="onKeydown"
      >
        <svg
          class="board-svg"
          viewBox="0 0 8 8"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <rect
            v-for="cell in cells"
            :key="`sq-${cell.square}`"
            :x="cell.col"
            :y="cell.row"
            :width="PIECE_UNIT"
            :height="PIECE_UNIT"
            class="sq"
            :class="cell.light ? 'light' : 'dark'"
          />
          <rect
            v-for="cell in cells"
            :key="`hover-${cell.square}`"
            :x="cell.col"
            :y="cell.row"
            :width="PIECE_UNIT"
            :height="PIECE_UNIT"
            class="state-overlay hover"
            :class="{ active: hoverSquare === cell.square }"
          />
          <rect
            v-for="overlay in stateOverlays"
            :key="overlay.key"
            :x="overlay.col"
            :y="overlay.row"
            :width="PIECE_UNIT"
            :height="PIECE_UNIT"
            class="state-overlay"
            :class="overlay.kind"
          />
          <rect
            v-if="selectedMarker"
            :x="selectedMarker.x"
            :y="selectedMarker.y"
            :width="selectedMarker.w"
            :height="selectedMarker.h"
            class="state-overlay selected"
          />
          <rect
            v-if="selectedMarker"
            :x="selectedMarker.x + 0.05"
            :y="selectedMarker.y + 0.05"
            width="0.9"
            height="0.9"
            rx="0.08"
            class="selected-ring"
          />
          <rect
            v-if="focusedMarker"
            :x="focusedMarker.x + 0.08"
            :y="focusedMarker.y + 0.08"
            width="0.84"
            height="0.84"
            rx="0.08"
            class="focused-ring"
          />
          <rect
            v-if="checkMarker"
            :x="checkMarker.x"
            :y="checkMarker.y"
            :width="checkMarker.w"
            :height="checkMarker.h"
            class="state-overlay check"
          />
          <template v-for="destination in activeDestMarkers" :key="`dst-${destination.key}`">
            <circle
              v-if="!destination.capture"
              :cx="destination.cx"
              :cy="destination.cy"
              :r="QUIET_MOVE_RADIUS"
              class="move-dot"
            />
            <template v-else>
              <circle
                :cx="destination.cx"
                :cy="destination.cy"
                :r="CAPTURE_OUTLINE_RADIUS"
                class="move-ring-outline"
              />
              <circle
                :cx="destination.cx"
                :cy="destination.cy"
                :r="CAPTURE_RING_RADIUS"
                class="move-ring"
              />
            </template>
          </template>
          <image
            v-for="cell in pieces"
            :key="`pc-${cell.square}`"
            :href="pieceImg(cell.letter)"
            :x="cell.col"
            :y="cell.row"
            :width="PIECE_UNIT"
            :height="PIECE_UNIT"
            class="piece-img"
            :class="{ dragging: draggingFrom === cell.square }"
            :data-square="cell.square"
            preserveAspectRatio="xMidYMid meet"
            @dragstart.prevent
          />
        </svg>

        <div
          v-if="overlayOn"
          class="move-overlay"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onCancel"
          @pointerleave="onLeave"
        />

        <img
          v-if="ghost"
          class="ghost"
          :src="pieceImg(ghost.letter)"
          :style="{
            left: `${ghost.x}px`,
            top: `${ghost.y}px`,
            width: `${squarePx}px`,
            height: `${squarePx}px`,
          }"
          alt=""
          draggable="false"
        />
      </div>
      <div class="coords ranks ranks-right" aria-hidden="true">
        <span v-for="rank in ranks" :key="`right-${rank}`">{{ rank }}</span>
      </div>
      <div class="coords files files-bottom" aria-hidden="true">
        <span v-for="file in files" :key="`bottom-${file}`">{{ file }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-view {
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.board-frame {
  position: relative;
  display: grid;
  grid-template:
    '. files-top .' var(--board-coordinate-gutter)
    'ranks-left board ranks-right' minmax(0, 1fr)
    '. files-bottom .' var(--board-coordinate-gutter)
    / var(--board-coordinate-gutter) minmax(0, 1fr) var(--board-coordinate-gutter);
  width: min(100%, 100cqw, 100cqh);
  aspect-ratio: 1 / 1;
  gap: var(--board-coordinate-gap);
  padding: var(--board-coordinate-pad);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--board-frame-radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.cg-wrap {
  position: relative;
  grid-area: board;
  width: 100%;
  min-width: 0;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--board-square-radius);
  outline: var(--workspace-border-w) solid var(--border-strong);
  box-shadow: var(--shadow-md);
}

.cg-wrap:focus-visible {
  box-shadow:
    var(--shadow-md),
    var(--state-focus-ring);
}

.board-svg {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}

.coords {
  display: flex;
  min-width: 0;
  min-height: 0;
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--board-coordinate-font-size);
  font-variant-numeric: tabular-nums;
  font-weight: var(--board-coordinate-font-weight);
  line-height: 1;
  text-shadow: var(--board-coordinate-halo);
  user-select: none;
}

.coords span {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}

.ranks {
  flex-direction: column;
}

.files {
  flex-direction: row;
}

.ranks-left {
  grid-area: ranks-left;
}

.ranks-right {
  grid-area: ranks-right;
}

.files-top {
  grid-area: files-top;
}

.files-bottom {
  grid-area: files-bottom;
}

.board-svg .sq {
  transition: fill var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard);
}

.board-svg .sq.light {
  fill: var(--cg-square-light);
}

.board-svg .sq.dark {
  fill: var(--cg-square-dark);
}

.board-svg .state-overlay {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
}

.board-svg .state-overlay.hover {
  opacity: 0;
  fill: var(--cg-overlay-hover);
  transition: opacity var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard);
}

.board-svg .state-overlay.hover.active {
  opacity: 1;
}

.board-svg .state-overlay.last-move {
  fill: var(--cg-overlay-lastmove);
}

.board-svg .state-overlay.selected {
  fill: var(--cg-overlay-selected);
}

.board-svg .state-overlay.drop-ok {
  fill: var(--cg-overlay-drop-ok);
}

.board-svg .state-overlay.drop-bad {
  fill: var(--cg-overlay-drop-bad);
}

.board-svg .state-overlay.check {
  fill: var(--cg-overlay-check);
}

.selected-ring {
  fill: none;
  stroke: var(--cg-select-ring);
  stroke-width: var(--board-selected-ring-stroke);
  pointer-events: none;
}

.focused-ring {
  fill: none;
  stroke: var(--border-focus);
  stroke-width: var(--board-focused-ring-stroke);
  pointer-events: none;
}

.move-dot {
  fill: var(--cg-hint-fill);
  stroke: var(--cg-hint-stroke);
  stroke-width: var(--board-move-dot-stroke);
  pointer-events: none;
}

.move-ring-outline {
  fill: none;
  stroke: var(--cg-hint-stroke);
  stroke-width: var(--board-move-ring-outline-stroke);
  pointer-events: none;
}

.move-ring {
  fill: var(--cg-hint-capture-fill);
  stroke: var(--cg-hint-fill);
  stroke-width: var(--board-move-ring-stroke);
  pointer-events: none;
}

.piece-img {
  pointer-events: none;
  filter: var(--board-piece-filter);
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
  user-select: none;
}

.piece-img.dragging {
  opacity: 0;
}

.move-overlay {
  position: absolute;
  inset: 0;
  z-index: var(--board-overlay-z);
  cursor: grab;
  touch-action: none;
}

.move-overlay:active {
  cursor: grabbing;
}

.ghost {
  position: fixed;
  z-index: var(--board-ghost-z);
  filter: var(--board-ghost-filter);
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: left, top, transform;
}
</style>
