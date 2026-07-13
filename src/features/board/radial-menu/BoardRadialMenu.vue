<script setup lang="ts">
import type { BoardRadialCommand } from '../domain/boardCapabilities'
import {
  useBoardRadialMenuView,
  type BoardRadialMenuProps,
} from './useBoardRadialMenuView'

const props = defineProps<BoardRadialMenuProps>()

const emit = defineEmits<{
  select: [command: BoardRadialCommand | null]
}>()

const {
  geometry,
  labelPoint,
  menuStyle,
  optionClass,
  options,
  rootEl,
  sectorPath,
  selectedIndex,
  widthFocusRect,
  widthStroke,
} = useBoardRadialMenuView(props, {
  onSelect: (command) => emit('select', command),
})
</script>

<template>
  <div ref="rootEl" class="radial-menu" :class="{ open }" :style="menuStyle" aria-hidden="true">
    <svg class="radial-menu-svg" :viewBox="`0 0 ${geometry.menuSize} ${geometry.menuSize}`">
      <g>
        <g
          v-for="(option, index) in options"
          :key="option.id"
          class="radial-menu-slice"
          :class="[
            optionClass(option),
            { selected: selectedIndex === index, active: option.active, disabled: option.disabled },
          ]"
        >
          <path class="radial-menu-sector" :d="sectorPath(index)" />
          <path
            v-if="option.command.kind === 'shape'"
            class="radial-menu-active-indicator radial-menu-active-sector"
            :data-active="option.active"
            :d="sectorPath(index)"
          />
          <circle
            v-if="option.fill"
            class="radial-menu-active-indicator radial-menu-active-color"
            :data-active="option.active"
            :cx="labelPoint(index).x"
            :cy="labelPoint(index).y"
            :r="geometry.colorFocusRadius"
          />
          <rect
            v-else-if="option.command.kind === 'width'"
            class="radial-menu-active-indicator radial-menu-active-width"
            :data-active="option.active"
            :x="widthFocusRect(index).x"
            :y="widthFocusRect(index).y"
            :width="widthFocusRect(index).width"
            :height="widthFocusRect(index).height"
            :rx="widthFocusRect(index).rx"
          />
          <circle
            v-if="option.fill"
            class="radial-menu-color"
            :cx="labelPoint(index).x"
            :cy="labelPoint(index).y"
            :r="geometry.colorSwatchRadius"
            :fill="option.fill"
          />
          <line
            v-else-if="option.command.kind === 'width'"
            class="radial-menu-width"
            :x1="labelPoint(index).x - geometry.widthMarkHalf"
            :y1="labelPoint(index).y"
            :x2="labelPoint(index).x + geometry.widthMarkHalf"
            :y2="labelPoint(index).y"
            :stroke-width="widthStroke(option)"
          />
          <text v-else class="radial-menu-label" :x="labelPoint(index).x" :y="labelPoint(index).y">
            {{ option.label }}
          </text>
          <title>{{ option.title }}</title>
        </g>
      </g>
      <circle
        class="radial-menu-core"
        :cx="geometry.menuCenter"
        :cy="geometry.menuCenter"
        :r="geometry.coreRadius"
      />
    </svg>
  </div>
</template>

<style scoped>
.radial-menu {
  position: fixed;
  z-index: var(--board-radial-z);
  width: var(--board-radial-size);
  height: var(--board-radial-size);
  overflow: visible;
  pointer-events: none;
  background: transparent;
  border: 0;
  box-shadow: var(--board-radial-shadow);
  opacity: 0;
  transform: translate(-50%, -50%);
  transform-origin: var(--board-radial-center) var(--board-radial-center);
}

.radial-menu-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.radial-menu-slice {
  opacity: 0;
  transform-box: view-box;
  transform-origin: var(--board-radial-center) var(--board-radial-center);
}

.radial-menu-slice.disabled {
  opacity: var(--workspace-disabled-opacity);
}

.radial-menu-sector {
  fill: var(--board-radial-slice-fill);
  stroke: var(--board-radial-divider);
  stroke-width: var(--board-radial-sector-stroke);
  transition:
    fill var(--board-radial-css-duration) var(--workspace-motion-ease-standard),
    stroke var(--board-radial-css-duration) var(--workspace-motion-ease-standard),
    stroke-width var(--board-radial-css-duration) var(--workspace-motion-ease-standard);
}

.radial-menu-active-indicator {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: none;
}

.radial-menu-active-sector {
  fill: var(--board-radial-primary-soft);
  stroke: var(--board-radial-primary-line);
  stroke-width: var(--board-radial-active-sector-stroke);
  filter: var(--board-radial-active-shadow);
}

.radial-menu-active-color {
  fill: var(--board-radial-active-fill);
  stroke: var(--board-radial-primary-line);
  stroke-width: var(--board-radial-active-color-stroke);
  filter: var(--board-radial-active-shadow);
}

.radial-menu-active-width {
  fill: var(--board-radial-active-fill);
  stroke: var(--board-radial-primary-line);
  stroke-width: var(--board-radial-active-width-stroke);
  filter: var(--board-radial-active-shadow);
}

.radial-menu-slice.selected .radial-menu-sector {
  fill: var(--board-radial-slice-selected);
  stroke: var(--board-radial-slice-active);
}

.radial-menu-slice.active .radial-menu-sector {
  stroke: var(--board-radial-slice-active);
  stroke-width: var(--board-radial-slice-active-stroke);
}

.radial-menu-label {
  fill: var(--text);
  font-family: var(--font-sans);
  font-size: var(--board-radial-label-font-size);
  font-weight: var(--board-radial-label-font-weight);
  letter-spacing: 0;
  dominant-baseline: middle;
  text-anchor: middle;
  user-select: none;
}

.radial-menu-color {
  stroke: var(--board-radial-swatch-ring);
  stroke-width: var(--board-radial-swatch-stroke);
  filter: var(--board-radial-swatch-shadow);
}

.radial-menu-width {
  stroke: var(--text);
  stroke-linecap: round;
  filter: var(--board-radial-width-shadow);
}

.radial-menu-core {
  fill: var(--board-radial-core-fill);
  stroke: var(--board-radial-divider);
  stroke-width: var(--board-radial-sector-stroke);
}
</style>
