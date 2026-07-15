import Dexie, { type Table } from 'dexie'
import { z } from 'zod'

import {
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
} from '@/features/board/domain/boardTypes'

const WORKSPACE_LAYOUT_ID = 'current'
const WORKSPACE_LAYOUT_SCHEMA_VERSION = 1
const WORKSPACE_LAYOUT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const WorkspaceLayoutSchema = z.strictObject({
  showLeftSidebar: z.boolean(),
  showAnalysisRegion: z.boolean(),
  toolbarCollapsed: z.boolean(),
  boardAlignment: z.enum(['left', 'center', 'right']),
  boardOrientation: z.enum([BOARD_ORIENTATION_WHITE, BOARD_ORIENTATION_BLACK]),
  activeRightTab: z.enum(['notation', 'comments', 'annotations', 'analysis']),
  rightPgnHeightPx: z.number().finite().nonnegative().nullable(),
})

const WorkspaceLayoutRecordSchema = z.strictObject({
  id: z.literal(WORKSPACE_LAYOUT_ID),
  schemaVersion: z.literal(WORKSPACE_LAYOUT_SCHEMA_VERSION),
  updatedAt: z.number().finite().positive(),
  layout: WorkspaceLayoutSchema,
})

export type PersistedWorkspaceLayout = z.infer<typeof WorkspaceLayoutSchema>
type WorkspaceLayoutRecord = z.infer<typeof WorkspaceLayoutRecordSchema>

class WorkspaceLayoutDatabase extends Dexie {
  workspaceSession!: Table<WorkspaceLayoutRecord, string>

  constructor() {
    super('chess-pgnviewer-vue')
    this.version(1).stores({ workspaceSession: 'id, updatedAt' })
  }
}

let database: WorkspaceLayoutDatabase | null = null

function workspaceDatabase(): WorkspaceLayoutDatabase {
  database ??= new WorkspaceLayoutDatabase()
  return database
}

async function discardStoredLayout(): Promise<void> {
  try {
    await workspaceDatabase().workspaceSession.delete(WORKSPACE_LAYOUT_ID)
  } catch {
    // Storage may be blocked or unavailable; defaults remain authoritative.
  }
}

export async function readWorkspaceLayout(): Promise<PersistedWorkspaceLayout | null> {
  try {
    const stored = await workspaceDatabase().workspaceSession.get(WORKSPACE_LAYOUT_ID)
    if (!stored) return null

    const parsed = WorkspaceLayoutRecordSchema.safeParse(stored)
    if (!parsed.success || Date.now() - parsed.data.updatedAt > WORKSPACE_LAYOUT_MAX_AGE_MS) {
      await discardStoredLayout()
      return null
    }

    return parsed.data.layout
  } catch {
    return null
  }
}

export async function saveWorkspaceLayout(layout: PersistedWorkspaceLayout): Promise<boolean> {
  const parsed = WorkspaceLayoutSchema.safeParse(layout)
  if (!parsed.success) return false

  try {
    await workspaceDatabase().workspaceSession.put({
      id: WORKSPACE_LAYOUT_ID,
      schemaVersion: WORKSPACE_LAYOUT_SCHEMA_VERSION,
      updatedAt: Date.now(),
      layout: parsed.data,
    })
    return true
  } catch {
    // Layout persistence is recoverable and must not block workspace use.
    return false
  }
}
