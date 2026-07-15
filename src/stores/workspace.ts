import { defineStore } from 'pinia'

import {
  DEFAULT_ANNOTATION_COLOR,
  isAnnotationColorId,
  type AnnotationShapeKind,
  type AnnotationColorId,
} from '@/features/annotations/domain/annotationTypes'
import {
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
  type BoardOrientation,
} from '@/features/board/domain/boardTypes'
import {
  saveWorkspaceLayout,
  type PersistedWorkspaceLayout,
} from '@/persistence/workspace/workspaceLayoutPersistence'

type WorkspacePanelTab = 'notation' | 'comments' | 'annotations' | 'analysis'
type WorkspaceAnnotationTool = AnnotationShapeKind | null
type WorkspaceBoardAlignment = 'left' | 'center' | 'right'

interface WorkspaceState {
  showLeftSidebar: boolean
  showAnalysisRegion: boolean
  toolbarCollapsed: boolean
  boardAlignment: WorkspaceBoardAlignment
  boardOrientation: BoardOrientation
  activeRightTab: WorkspacePanelTab
  annotationTool: WorkspaceAnnotationTool
  annotationColor: AnnotationColorId
  rightPgnHeightPx: number | null
  splitterDragging: boolean
  layoutWriteInProgress: boolean
  lastLayoutWriteSucceeded: boolean | null
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    showLeftSidebar: true,
    showAnalysisRegion: false,
    toolbarCollapsed: false,
    boardAlignment: 'center',
    boardOrientation: BOARD_ORIENTATION_WHITE,
    activeRightTab: 'notation',
    annotationTool: null,
    annotationColor: DEFAULT_ANNOTATION_COLOR,
    rightPgnHeightPx: null,
    splitterDragging: false,
    layoutWriteInProgress: false,
    lastLayoutWriteSucceeded: null,
  }),

  actions: {
    persistedLayout(): PersistedWorkspaceLayout {
      return {
        showLeftSidebar: this.showLeftSidebar,
        showAnalysisRegion: this.showAnalysisRegion,
        toolbarCollapsed: this.toolbarCollapsed,
        boardAlignment: this.boardAlignment,
        boardOrientation: this.boardOrientation,
        activeRightTab: this.activeRightTab,
        rightPgnHeightPx: this.rightPgnHeightPx,
      }
    },
    restorePersistedLayout(layout: PersistedWorkspaceLayout): void {
      this.showLeftSidebar = layout.showLeftSidebar
      this.showAnalysisRegion = layout.showAnalysisRegion
      this.toolbarCollapsed = layout.toolbarCollapsed
      this.boardAlignment = layout.boardAlignment
      this.boardOrientation = layout.boardOrientation
      this.activeRightTab = layout.activeRightTab
      this.rightPgnHeightPx = layout.rightPgnHeightPx
      this.splitterDragging = false
    },
    async persistLayout(): Promise<boolean> {
      this.layoutWriteInProgress = true
      const succeeded = await saveWorkspaceLayout(this.persistedLayout())
      this.lastLayoutWriteSucceeded = succeeded
      this.layoutWriteInProgress = false
      return succeeded
    },
    async toggleLeftSidebar(): Promise<boolean> {
      this.showLeftSidebar = !this.showLeftSidebar
      return this.persistLayout()
    },
    async setShowLeftSidebar(value: boolean): Promise<boolean> {
      this.showLeftSidebar = value
      return this.persistLayout()
    },
    async toggleAnalysisRegion(): Promise<boolean> {
      this.showAnalysisRegion = !this.showAnalysisRegion
      this.activeRightTab = this.showAnalysisRegion ? 'analysis' : 'notation'
      if (!this.showAnalysisRegion) {
        this.rightPgnHeightPx = null
      }
      return this.persistLayout()
    },
    async setShowAnalysisRegion(value: boolean): Promise<boolean> {
      this.showAnalysisRegion = value
      this.activeRightTab = value ? 'analysis' : 'notation'
      if (!value) {
        this.rightPgnHeightPx = null
      }
      return this.persistLayout()
    },
    async toggleToolbar(): Promise<boolean> {
      this.toolbarCollapsed = !this.toolbarCollapsed
      return this.persistLayout()
    },
    async setToolbarCollapsed(value: boolean): Promise<boolean> {
      this.toolbarCollapsed = value
      return this.persistLayout()
    },
    async setBoardAlignment(alignment: WorkspaceBoardAlignment): Promise<boolean> {
      if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
        this.boardAlignment = alignment
        return this.persistLayout()
      }
      return false
    },
    async setBoardOrientation(orientation: BoardOrientation): Promise<boolean> {
      if (orientation === BOARD_ORIENTATION_WHITE || orientation === BOARD_ORIENTATION_BLACK) {
        this.boardOrientation = orientation
        return this.persistLayout()
      }
      return false
    },
    flipBoardOrientation(): void {
      this.boardOrientation =
        this.boardOrientation === BOARD_ORIENTATION_WHITE
          ? BOARD_ORIENTATION_BLACK
          : BOARD_ORIENTATION_WHITE
      void this.persistLayout()
    },
    async setActiveRightTab(tab: WorkspacePanelTab): Promise<boolean> {
      if (tab !== 'notation' && tab !== 'comments' && tab !== 'annotations' && tab !== 'analysis') {
        return false
      }

      this.activeRightTab = tab
      if (tab === 'analysis') {
        this.showAnalysisRegion = true
      }
      return this.persistLayout()
    },
    async resetRightPgnHeightPx(): Promise<boolean> {
      this.rightPgnHeightPx = null
      return this.persistLayout()
    },
    setAnnotationTool(tool: WorkspaceAnnotationTool): void {
      if (tool !== 'arrow' && tool !== 'square' && tool !== 'highlight' && tool !== null) {
        return
      }

      this.annotationTool = this.annotationTool === tool ? null : tool
    },
    setAnnotationColor(color: AnnotationColorId): void {
      if (isAnnotationColorId(color)) {
        this.annotationColor = color
      }
    },
    setRightPgnHeightPx(height: number | null): void {
      this.rightPgnHeightPx = height
    },
    setSplitterDragging(dragging: boolean): void {
      const finished = this.splitterDragging && !dragging
      this.splitterDragging = dragging
      if (finished) void this.persistLayout()
    },
  },
})
