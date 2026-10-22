import { COMPONENT, COMPONENT_INSTANCE, isComponentInstance, tag } from './brand'
import type { Component, RenderFn } from './component.type'
import { setupHooks } from './hooks'
import type { RenderOptions } from './render.type'
import type { Child } from './dom.type'
import { isPlainObject } from './functions'

export const $components = (fn: RenderFn): Component => {
  const component = ((first?: RenderOptions | Child, second?: Child) => {
    const hooks = setupHooks()

    // 与 render.ts 同款判定：普通对象即 options（排除同为普通对象的 ComponentInstance）。
    const options =
      isPlainObject(first) && !isComponentInstance(first) ? (first as RenderOptions) : undefined
    const props = options?.$props ?? {}
    const child = options ? second : (first as Child | undefined)

    const el = fn(props, child)

    return { el, hooks, [COMPONENT_INSTANCE]: true }
  }) as Component

  return tag(component, COMPONENT)
}
