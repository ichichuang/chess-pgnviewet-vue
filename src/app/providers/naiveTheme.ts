import { darkTheme } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'

import type { ResolvedTheme } from '@/theme/types'

export type NaiveResolvedTheme = GlobalTheme | null

export function resolveNaiveTheme(resolvedTheme: ResolvedTheme): NaiveResolvedTheme {
  return resolvedTheme === 'dark' ? darkTheme : null
}
