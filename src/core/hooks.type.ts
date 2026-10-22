export type CB = () => void

export interface Lifecycle {
  onClean: (cb: CB) => void
  onMounted: (cb: CB) => void
}
