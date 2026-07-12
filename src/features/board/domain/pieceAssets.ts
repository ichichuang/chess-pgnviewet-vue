import bb from '@/assets/chess/pieces/merida/bb.png?inline'
import bk from '@/assets/chess/pieces/merida/bk.png?inline'
import bn from '@/assets/chess/pieces/merida/bn.png?inline'
import bp from '@/assets/chess/pieces/merida/bp.png?inline'
import bq from '@/assets/chess/pieces/merida/bq.png?inline'
import br from '@/assets/chess/pieces/merida/br.png?inline'
import wb from '@/assets/chess/pieces/merida/wb.png?inline'
import wk from '@/assets/chess/pieces/merida/wk.png?inline'
import wn from '@/assets/chess/pieces/merida/wn.png?inline'
import wp from '@/assets/chess/pieces/merida/wp.png?inline'
import wq from '@/assets/chess/pieces/merida/wq.png?inline'
import wr from '@/assets/chess/pieces/merida/wr.png?inline'

const PIECE_IMAGES: Record<string, string> = {
  B: wb,
  K: wk,
  N: wn,
  P: wp,
  Q: wq,
  R: wr,
  b: bb,
  k: bk,
  n: bn,
  p: bp,
  q: bq,
  r: br,
}

export function pieceImg(letter: string): string {
  return PIECE_IMAGES[letter] ?? ''
}
