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
    persistLayout(): void {
      void saveWorkspaceLayout(this.persistedLayout())
    },
    toggleLeftSidebar(): void {
      this.showLeftSidebar = !this.showLeftSidebar
      this.persistLayout()
    },
    toggleAnalysisRegion(): void {
      this.showAnalysisRegion = !this.showAnalysisRegion
      this.activeRightTab = this.showAnalysisRegion ? 'analysis' : 'notation'
      if (!this.showAnalysisRegion) {
        this.rightPgnHeightPx = null
      }
      this.persistLayout()
    },
    toggleToolbar(): void {
      this.toolbarCollapsed = !this.toolbarCollapsed
      this.persistLayout()
    },
    setBoardAlignment(alignment: WorkspaceBoardAlignment): void {
      if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
        this.boardAlignment = alignment
        this.persistLayout()
      }
    },
    flipBoardOrientation(): void {
      this.boardOrientation =
        this.boardOrientation === BOARD_ORIENTATION_WHITE
          ? BOARD_ORIENTATION_BLACK
          : BOARD_ORIENTATION_WHITE
      this.persistLayout()
    },
    setActiveRightTab(tab: WorkspacePanelTab): void {
      if (tab !== 'notation' && tab !== 'comments' && tab !== 'annotations' && tab !== 'analysis') {
        return
      }

      this.activeRightTab = tab
      if (tab === 'analysis') {
        this.showAnalysisRegion = true
      }
      this.persistLayout()
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
      if (finished) this.persistLayout()
    },
  },
})
