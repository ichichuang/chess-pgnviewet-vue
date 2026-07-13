interface FormattableScore {
  kind: 'cp' | 'mate'
  value: number
  whiteValue: number
}

export function formatWhiteScore(score: FormattableScore | undefined): string {
  if (!score) {
    return '—'
  }

  if (score.kind === 'mate') {
    return `#${score.whiteValue}`
  }

  const pawns = score.whiteValue / 100

  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
}

export function formatMoverScore(score: FormattableScore | undefined): string {
  if (!score) {
    return '—'
  }

  if (score.kind === 'mate') {
    return `#${score.value}`
  }

  const pawns = score.value / 100

  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
}
