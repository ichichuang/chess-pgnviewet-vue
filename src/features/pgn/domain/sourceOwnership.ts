import type { DataSource } from './types'

let memorySourceSequence = 0

function memorySourceId(prefix: 'local' | 'readonly'): string {
  memorySourceSequence += 1
  const randomId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${memorySourceSequence.toString(36)}`

  return `${prefix}:${randomId}`
}

export function emptyDataSource(): DataSource {
  return {
    type: 'null',
    id: '',
    ownership: 'none',
    editable: false,
    localCopyPolicy: 'forbidden',
    origin: 'none',
  }
}

export function localFileDataSource(filename?: string): DataSource {
  return {
    type: 'FS',
    id: memorySourceId('local'),
    ownership: 'local',
    editable: true,
    localCopyPolicy: 'not-applicable',
    origin: 'local-file',
    ...(filename ? { filename } : {}),
  }
}

export function manualPositionDataSource(): DataSource {
  return {
    type: 'manual',
    id: memorySourceId('local'),
    ownership: 'local',
    editable: true,
    localCopyPolicy: 'not-applicable',
    origin: 'manual-position',
  }
}

export function editableLocalCopyDataSource(): DataSource {
  return {
    type: 'FS',
    id: memorySourceId('local'),
    ownership: 'local',
    editable: true,
    localCopyPolicy: 'not-applicable',
    origin: 'readonly-copy',
  }
}

export function completedReadonlyDataSource(
  origin: 'completed-replay' | 'completed-commentary',
  filename?: string
): DataSource {
  return {
    type: origin === 'completed-replay' ? 'remote_replay' : 'competition_snapshot',
    id: memorySourceId('readonly'),
    ownership: 'remote',
    editable: false,
    localCopyPolicy: 'completed-snapshot',
    origin,
    ...(filename ? { filename } : {}),
  }
}

export function isLocalEditableDataSource(source: DataSource): boolean {
  return source.ownership === 'local' && source.editable
}

export function canCopyReadonlySnapshot(source: DataSource): boolean {
  return source.ownership === 'remote' && source.localCopyPolicy === 'completed-snapshot'
}

export function localSourceIdentityLabel(source: DataSource): string {
  if (!isLocalEditableDataSource(source)) return ''
  const identity = source.id.slice(source.id.indexOf(':') + 1, source.id.indexOf(':') + 9)
  return `本地来源 ${identity}`
}
