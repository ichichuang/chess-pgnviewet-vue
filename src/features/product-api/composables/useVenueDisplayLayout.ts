import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

// OD-05/OD-06 provisional readability constants.
// These are owner-confirmation placeholders, not CSS Token constants or product defaults.
const MIN_CARD_WIDTH = 280
const MIN_CARD_HEIGHT = 140
const CELL_GAP = 12
const MAX_COLUMNS = 4
const MAX_ROWS = 4

interface StageSize {
  width: number
  height: number
}

export function useVenueDisplayLayout(stageRef: Ref<HTMLElement | null>): {
  columns: Ref<number>
  rows: Ref<number>
  pageSize: Ref<number>
} {
  const size = ref<StageSize>({ width: 0, height: 0 })
  const columns = ref(1)
  const rows = ref(1)
  const pageSize = computed(() => Math.max(1, columns.value * rows.value))

  function measure(el: HTMLElement): void {
    const rect = el.getBoundingClientRect()
    size.value = { width: rect.width, height: rect.height }
  }

  function recalculate(): void {
    const { width, height } = size.value
    if (width <= 0 || height <= 0) {
      columns.value = 1
      rows.value = 1
      return
    }

    const cols = Math.max(
      1,
      Math.min(MAX_COLUMNS, Math.floor((width + CELL_GAP) / (MIN_CARD_WIDTH + CELL_GAP)))
    )
    const rws = Math.max(
      1,
      Math.min(MAX_ROWS, Math.floor((height + CELL_GAP) / (MIN_CARD_HEIGHT + CELL_GAP)))
    )

    columns.value = cols
    rows.value = rws
  }

  let observer: ResizeObserver | null = null

  function attach(): void {
    const el = stageRef.value
    if (!el || typeof ResizeObserver === 'undefined') return

    observer?.disconnect()
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      size.value = { width, height }
      recalculate()
    })
    observer.observe(el)
    measure(el)
    recalculate()
  }

  function detach(): void {
    observer?.disconnect()
    observer = null
  }

  onMounted(attach)
  onUnmounted(detach)
  watch(stageRef, attach)
  watch(size, recalculate)

  return { columns, rows, pageSize }
}
