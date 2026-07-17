import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type CSSProperties,
  type ComputedRef,
  type Ref,
} from 'vue'

const SCORE_EPSILON = 0.01

interface StageMetrics {
  readonly width: number
  readonly height: number
  readonly cellSpacing: number
  readonly playerHeaderHeight: number
}

interface VenueDisplayCandidate {
  readonly columns: number
  readonly rows: number
  readonly boardSize: number
  readonly tileWidth: number
  readonly tileHeight: number
  readonly emptyCells: number
  readonly aspectDistortion: number
}

interface VenueDisplayLayoutStyle extends CSSProperties {
  '--venue-display-grid-columns': string
  '--venue-display-grid-rows': string
  '--venue-display-board-size': string
}

export interface VenueDisplayLayout {
  readonly columns: Ref<number>
  readonly rows: Ref<number>
  readonly boardSize: Ref<number>
  readonly tileWidth: Ref<number>
  readonly tileHeight: Ref<number>
  readonly style: ComputedRef<VenueDisplayLayoutStyle>
}

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function candidateFor(
  pairingCount: number,
  columns: number,
  metrics: StageMetrics
): VenueDisplayCandidate {
  const rows = Math.ceil(pairingCount / columns)
  const usableWidth = Math.max(0, metrics.width - (columns - 1) * metrics.cellSpacing)
  const usableHeight = Math.max(0, metrics.height - (rows - 1) * metrics.cellSpacing)
  const tileWidth = usableWidth / columns
  const tileHeight = usableHeight / rows
  const boardCapacity = Math.max(0, tileHeight - metrics.playerHeaderHeight)
  const boardSize = Math.max(0, Math.min(tileWidth, boardCapacity))
  const largerDimension = Math.max(tileWidth, boardCapacity, 1)

  return {
    columns,
    rows,
    boardSize,
    tileWidth,
    tileHeight,
    emptyCells: columns * rows - pairingCount,
    aspectDistortion: Math.abs(tileWidth - boardCapacity) / largerDimension,
  }
}

function isBetterCandidate(
  candidate: VenueDisplayCandidate,
  current: VenueDisplayCandidate
): boolean {
  const boardSizeDelta = candidate.boardSize - current.boardSize
  if (Math.abs(boardSizeDelta) > SCORE_EPSILON) return boardSizeDelta > 0

  if (candidate.emptyCells !== current.emptyCells) {
    return candidate.emptyCells < current.emptyCells
  }

  const distortionDelta = candidate.aspectDistortion - current.aspectDistortion
  if (Math.abs(distortionDelta) > SCORE_EPSILON) return distortionDelta < 0

  return candidate.columns < current.columns
}

function calculateVenueDisplayLayout(
  pairingCount: number,
  metrics: StageMetrics
): VenueDisplayCandidate {
  const safePairingCount = Math.max(1, Math.floor(pairingCount))
  let best = candidateFor(safePairingCount, 1, metrics)

  for (let columns = 2; columns <= safePairingCount; columns += 1) {
    const candidate = candidateFor(safePairingCount, columns, metrics)
    if (isBetterCandidate(candidate, best)) best = candidate
  }

  return best
}

export function useVenueDisplayLayout(
  stageRef: Ref<HTMLElement | null>,
  playerHeaderProbeRef: Ref<HTMLElement | null>,
  pairingCount: Ref<number>
): VenueDisplayLayout {
  const metrics = ref<StageMetrics>({
    width: 0,
    height: 0,
    cellSpacing: 0,
    playerHeaderHeight: 0,
  })
  const columns = ref(1)
  const rows = ref(1)
  const boardSize = ref(0)
  const tileWidth = ref(0)
  const tileHeight = ref(0)

  const style = computed<VenueDisplayLayoutStyle>(() => ({
    '--venue-display-grid-columns': String(columns.value),
    '--venue-display-grid-rows': String(rows.value),
    '--venue-display-board-size': `${boardSize.value}px`,
  }))

  function measure(): void {
    const stage = stageRef.value
    const playerHeaderProbe = playerHeaderProbeRef.value
    if (!stage || !playerHeaderProbe) return

    const stageRect = stage.getBoundingClientRect()
    const playerHeaderRect = playerHeaderProbe.getBoundingClientRect()
    const stageStyle = getComputedStyle(stage)
    const cellSpacing = Number.parseFloat(stageStyle.columnGap)

    metrics.value = {
      width: finitePositive(stageRect.width),
      height: finitePositive(stageRect.height),
      cellSpacing: finitePositive(cellSpacing),
      playerHeaderHeight: finitePositive(playerHeaderRect.height),
    }
  }

  function recalculate(): void {
    const result = calculateVenueDisplayLayout(pairingCount.value, metrics.value)
    columns.value = result.columns
    rows.value = result.rows
    boardSize.value = result.boardSize
    tileWidth.value = result.tileWidth
    tileHeight.value = result.tileHeight
  }

  let observer: ResizeObserver | null = null

  function attach(): void {
    observer?.disconnect()
    observer = null

    const stage = stageRef.value
    const playerHeaderProbe = playerHeaderProbeRef.value
    if (!stage || !playerHeaderProbe) return

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure()
        recalculate()
      })
      observer.observe(stage)
      observer.observe(playerHeaderProbe)
    }

    measure()
    recalculate()
  }

  function detach(): void {
    observer?.disconnect()
    observer = null
  }

  onMounted(attach)
  onUnmounted(detach)
  watch([stageRef, playerHeaderProbeRef], attach, { flush: 'post' })
  watch(pairingCount, recalculate)

  return { columns, rows, boardSize, tileWidth, tileHeight, style }
}
