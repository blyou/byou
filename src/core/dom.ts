import { effect } from 'alien-signals'
import type { Child, Attributes } from './dom.type'
import { isComponent, isComponentInstance } from './brand'
import type { ComponentInstance } from './component.type'

export const $el = (tag: string, attrs?: Attributes | null, child?: Child): HTMLElement => {
  const el = document.createElement(tag)
  if (attrs) for (const key of Object.keys(attrs)) setAttrs(el, key, attrs[key])
  if (child != null) mountChild(el, child)
  return el
}

const mount = (parent: Node, child: Node, nodes?: Node[]): void => {
  parent.appendChild(child)
  if (nodes) nodes.push(child)
}
export const mountChild = (parent: Node, child: unknown, nodes?: Node[]): void => {
  if (child == null || typeof child === 'boolean') return
  if (isComponent(child)) child = child()
  if (isComponentInstance(child)) mountComponentInstance(parent, child)
  else if (child instanceof Node) mount(parent, child, nodes)
  else if (Array.isArray(child)) {
    const frag = document.createDocumentFragment()
    for (const el of child) mountChild(frag, el, nodes)
    parent.appendChild(frag)
  } else if (typeof child === 'function') bindChild(parent, child as () => unknown)
  else mount(parent, document.createTextNode(String(child)), nodes)
}
export const bindChild = (parent: Node, getter: () => unknown): void => {
  const anchor = document.createComment(' ↓ byou dynamic ↓ ')
  parent.appendChild(anchor)
  const nodes: Node[] = []
  const frag = document.createDocumentFragment()
  effect(() => {
    mountChild(frag, getter(), nodes)
    anchor.after(frag)
    return () => {
      const parent = anchor.parentNode
      if (!parent) return
      for (const node of nodes) parent.removeChild(node)
      nodes.length = 0
    }
  })
}
export const mountComponentInstance = (parent: Node, child: ComponentInstance): void => {
  const { el, hooks } = child
  const nodes: Node[] = []
  effect(() => {
    mountChild(parent, el, nodes)
    return () => {
      hooks.invokeClean()
      const parent = nodes[0]?.parentNode
      if (!parent) return
      for (const node of nodes) parent.removeChild(node)
      nodes.length = 0
    }
  })
}

// 事件属性：onclick / onmouseenter ... → addEventListener('click' / 'mouseenter', fn)
const isEvent = (key: string, value: unknown): value is EventListener =>
  key.startsWith('on') && key.length > 2 && typeof value === 'function'

// 动态值：本身是 getter，或数组/对象里嵌着 getter（如 class: [base, () => on() && 'on']）。
// 这类值必须放进 effect，才能在信号变化时只更新这一个属性。
const isDynamicAttr = (value: unknown): boolean => {
  if (typeof value === 'function') return true
  if (Array.isArray(value)) return value.some(isDynamicAttr)
  if (value && typeof value === 'object') return Object.values(value).some(isDynamicAttr)
  return false
}

// 取值：把 getter（含嵌套在数组/对象里的，如 class: [base, () => on() && 'on']）逐个跑掉，
// 得到静态值。在 effect 内调用时，这些读取都会被自动追踪。
const resolve = (value: unknown): unknown => {
  if (typeof value === 'function') return resolve((value as () => unknown)())
  if (Array.isArray(value)) return value.map(resolve)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value))
      out[key] = resolve((value as Record<string, unknown>)[key])
    return out
  }
  return value
}

// 类名归一化：字符串原样，数组递归展开并跳过空项，null/undefined/boolean 视为空。
const classOf = (value: unknown): string => {
  if (value == null || typeof value === 'boolean') return ''
  if (Array.isArray(value)) return value.map(classOf).filter(Boolean).join(' ')
  return String(value)
}

// style：字符串直接写 cssText；对象为整体替换，camelCase 与 kebab-case 都支持。
const setStyle = (el: HTMLElement, value: unknown) => {
  if (value == null || value === false) return el.removeAttribute('style')
  if (typeof value === 'string') return (el.style.cssText = value)
  el.style.cssText = ''
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const v = (value as Record<string, unknown>)[key]
    if (v == null || v === false) continue
    el.style.setProperty(
      key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`),
      String(v),
    )
  }
}

// 一次真实的属性写入
const setAttr = (el: HTMLElement, key: string, value: unknown): void => {
  if (key === 'class' || key === 'className') el.setAttribute('class', classOf(value))
  else if (key === 'style') setStyle(el, value)
  else if (value == null || value === false) el.removeAttribute(key)
  // disabled / hidden 这类布尔属性
  else if (value === true) el.setAttribute(key, '')
  // value / checked / id 等：写属性，避免 attribute 与 property 不同步
  else if (key in el) (el as any)[key] = value
  else el.setAttribute(key, String(value)) // data-* / aria-* 等
}

export const setAttrs = (el: HTMLElement, key: string, value: unknown): void => {
  if (isEvent(key, value)) return el.addEventListener(key.slice(2).toLowerCase(), value)
  // 动态值 → 交给 effect 细粒度订阅；静态值 → 写一次即可，不建 effect。
  if (isDynamicAttr(value)) effect(() => setAttr(el, key, resolve(value)))
  else setAttr(el, key, value)
}
