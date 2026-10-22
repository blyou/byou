import type { Attributes, Child } from './dom.type'

export type RenderOptions = Attributes & {
  $props?: Record<string, any>
}

export type Render = {
  (options: RenderOptions): Element
  (child: Child): Element
  (options: RenderOptions, child: Child): Element
}

export type $Type = typeof document.querySelector & {
  [tag in keyof HTMLElementTagNameMap]: Render
}
