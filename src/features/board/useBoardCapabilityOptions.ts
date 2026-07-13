import { computed, type ComputedRef } from 'vue'

import type {
  BoardAdvancedCapabilities,
  NormalizedBoardAdvancedCapabilities,
} from './domain/boardCapabilities'

export function useBoardCapabilityOptions(
  source: () => unknown
): ComputedRef<NormalizedBoardAdvancedCapabilities> {
  return computed(() => normalizeBoardAdvancedCapabilities(source()))
}

function normalizeBoardAdvancedCapabilities(value: unknown): NormalizedBoardAdvancedCapabilities {
  const options = value as BoardAdvancedCapabilities | undefined
  const editor: NormalizedBoardAdvancedCapabilities['editor'] = {
    available: options?.editor?.available === true,
    active: options?.editor?.available === true && options?.editor?.active === true,
  }

  if (options?.editor?.initialFen !== undefined) {
    editor.initialFen = options.editor.initialFen
  }

  return {
    animation: {
      move: {
        enabled: options?.animation?.move?.enabled === true,
        requestMove: options?.animation?.move?.requestMove,
      },
      snapback: {
        enabled: options?.animation?.snapback?.enabled === true,
      },
    },
    radialMenu: {
      enabled: options?.radialMenu?.enabled === true,
      activeShape: options?.radialMenu?.activeShape ?? null,
      colorIndex: Number.isInteger(options?.radialMenu?.colorIndex)
        ? Math.max(0, options?.radialMenu?.colorIndex ?? 0)
        : 0,
      width:
        options?.radialMenu?.width === 0.08 ||
        options?.radialMenu?.width === 0.16 ||
        options?.radialMenu?.width === 0.28
          ? options.radialMenu.width
          : 0.16,
      colors: options?.radialMenu?.colors ?? [],
    },
    editor,
    wheelNavigation: {
      enabled: options?.wheelNavigation?.enabled === true,
      blocked: options?.wheelNavigation?.blocked === true,
    },
  }
}
