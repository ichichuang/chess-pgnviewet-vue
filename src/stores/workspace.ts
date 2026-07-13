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
    toggleLeftSidebar(): void {
      this.showLeftSidebar = !this.showLeftSidebar
    },
    toggleAnalysisRegion(): void {
      this.showAnalysisRegion = !this.showAnalysisRegion
      this.activeRightTab = this.showAnalysisRegion ? 'analysis' : 'notation'
      if (!this.showAnalysisRegion) {
        this.rightPgnHeightPx = null
      }
    },
    toggleToolbar(): void {
      this.toolbarCollapsed = !this.toolbarCollapsed
    },
    setBoardAlignment(alignment: WorkspaceBoardAlignment): void {
      if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
        this.boardAlignment = alignment
      }
    },
    flipBoardOrientation(): void {
      this.boardOrientation =
        this.boardOrientation === BOARD_ORIENTATION_WHITE
          ? BOARD_ORIENTATION_BLACK
          : BOARD_ORIENTATION_WHITE
    },
    setActiveRightTab(tab: WorkspacePanelTab): void {
      if (tab !== 'notation' && tab !== 'comments' && tab !== 'annotations' && tab !== 'analysis') {
        return
      }

      this.activeRightTab = tab
      if (tab === 'analysis') {
        this.showAnalysisRegion = true
      }
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
      this.splitterDragging = dragging
    },
  },
})
