import type { COMPONENT, COMPONENT_INSTANCE } from './brand'
import type { Child } from './dom.type'
import type { Hooks } from './hooks'
import type { RenderOptions } from './render.type'

export type RenderFn = (props: any, child?: Child) => Child
export type Component = {
  (): ComponentInstance
  (options: RenderOptions): ComponentInstance
  (child: Child): ComponentInstance
  (options: RenderOptions, child: Child): ComponentInstance
  [COMPONENT]: boolean
}
export type ComponentInstance = {
  el: Child
  hooks: Hooks
  [COMPONENT_INSTANCE]: boolean
}
