import { effectScope } from 'alien-signals'
import { $el, mountChild } from './dom'
import type { Attributes, Child } from './dom.type'
import type { $Type, Render, RenderOptions } from './render.type'
import { isComponentInstance } from './brand'
import { isPlainObject } from './functions'

export const $mount = (select: string | HTMLElement, child: Child) => {
  const el = typeof select === 'string' ? document.querySelector(select) : select
  if (!el) return () => {}
  const stop = effectScope(() => {
    if (!el) return
    el.textContent = ''
    mountChild(el, child)
  })
  return () => {
    stop()
    el.textContent = ''
  }
}

// RenderOptions 是普通对象；ComponentInstance 虽然也是普通对象，但它是 Child，需排除。
const isOptions = (value: unknown): value is RenderOptions =>
  isPlainObject(value) && !isComponentInstance(value)

export const $ = new Proxy(document.querySelector.bind(document) as $Type, {
  get(target, p, receiver) {
    if (typeof p === 'symbol') return Reflect.get(target, p, receiver)

    return ((first?: RenderOptions | Child, second?: Child) => {
      const attrs = {} as Attributes
      let child: Child | undefined

      if (isOptions(first)) {
        // attrs 平铺在 options 顶层；$props 命名空间不写进 DOM，其值与 attrs 合并后生效。
        const { $props, ...rest } = first
        Object.assign(attrs, rest, $props)
        child = second
      } else {
        child = first as Child | undefined
      }

      return $el(p, attrs, child)
    }) as Render
  },
})
