import type { DataSource } from '@/features/pgn/domain/types'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'
import type {
  WorkspaceMode,
  WorkspaceModeContext,
  WorkspaceSource,
} from '@/features/workspace-mode/workspaceModeTypes'

export type SettingsPage = 'workspace' | 'competition-list' | 'competition-detail'
type SettingsSource =
  WorkspaceSource | 'local-file' | 'manual-position' | 'local-editable-copy' | 'none'
export type SettingsRightTab = 'notation' | 'comments' | 'annotations' | 'analysis'

export interface SettingsCapabilityContext {
  page: SettingsPage
  mode: WorkspaceMode | 'not-applicable'
  source: SettingsSource
  capabilities: {
    theme: boolean
    workspaceLayout: boolean
    sourcePanelLayout: boolean
    boardView: boolean
    rightPanel: boolean
    analysisLayout: boolean
  }
  availableRightTabs: SettingsRightTab[]
}

export function createWorkspaceSettingsContext(
  modeContext: WorkspaceModeContext,
  permissions: WorkspacePermissions,
  activeSource: DataSource
): SettingsCapabilityContext {
  const availableRightTabs: SettingsRightTab[] = ['notation']
  if (permissions.canShowComments) availableRightTabs.push('comments')
  if (permissions.canShowAnnotations) availableRightTabs.push('annotations')
  if (permissions.canShowAnalysisPanel) availableRightTabs.push('analysis')

  return {
    page: 'workspace',
    mode: activeSource.ownership === 'local' ? 'analysis' : modeContext.mode,
    source: settingsSource(modeContext.source, activeSource, permissions.hasSource),
    capabilities: {
      theme: true,
      workspaceLayout: true,
      sourcePanelLayout: true,
      boardView: permissions.hasSource,
      rightPanel: permissions.hasSource,
      analysisLayout: permissions.canShowAnalysisPanel,
    },
    availableRightTabs,
  }
}

export function createRouteSettingsContext(
  page: Exclude<SettingsPage, 'workspace'>
): SettingsCapabilityContext {
  return {
    page,
    mode: 'not-applicable',
    source: 'none',
    capabilities: {
      theme: true,
      workspaceLayout: false,
      sourcePanelLayout: false,
      boardView: false,
      rightPanel: false,
      analysisLayout: false,
    },
    availableRightTabs: [],
  }
}

function settingsSource(
  contextSource: WorkspaceSource,
  activeSource: DataSource,
  hasSource: boolean
): SettingsSource {
  if (!hasSource || activeSource.type === 'null') return 'none'
  if (activeSource.ownership !== 'local') return contextSource
  if (activeSource.origin === 'readonly-copy') return 'local-editable-copy'
  if (activeSource.origin === 'manual-position') return 'manual-position'
  return 'local-file'
}
