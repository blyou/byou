import type { Component, ComponentInstance } from './component.type'

export type Attrs = string | number | boolean | null | undefined | object | Attrs[] | (() => Attrs)
export type Child =
  | Node
  | string
  | number
  | null
  | undefined
  | Component
  | ComponentInstance
  | Child[]
  | (() => Child)

export type ClassValue = string | null | undefined | ClassValue[] | (() => ClassValue)
export interface HtmlAttributes {
  class?: ClassValue
  className?: ClassValue
  style?: Attrs | CSSStyleDeclaration
  id?: Attrs
  title?: Attrs
  href?: Attrs
  src?: Attrs
  alt?: Attrs
  value?: Attrs
  disabled?: Attrs
  checked?: Attrs
  selected?: Attrs
  readonly?: Attrs
  multiple?: Attrs
  type?: Attrs
  placeholder?: Attrs
  tabindex?: Attrs
  role?: Attrs
  name?: Attrs
  for?: Attrs
  target?: Attrs
  rel?: Attrs
  min?: Attrs
  max?: Attrs
  step?: Attrs
  lang?: Attrs
  hidden?: Attrs
  contenteditable?: Attrs
  draggable?: Attrs
  autofocus?: Attrs
  [key: string]: Attrs
}

// events：常用事件名 -> 事件对象类型的映射，供 on<Event> 属性回调参数推断使用。
// 用法见 e.div：e.div({ onmouseenter(e) { e.clientX } }) 里的 e 自动是 MouseEvent。
// 未在此列出的事件（onfoo 等）仍可用，但回调参数退化为未知类型。
//
// 注意：这里用显式罗列而非 mapped type —— mapped type 在重映射键后，值位置的
// EventMap[K] 会退化成 any，导致方法简写参数丢失具体类型。显式写法可保证精确推断。

export type EventAttributes = {
  // 鼠标
  onclick?: (e: MouseEvent) => void
  ondblclick?: (e: MouseEvent) => void
  onmousedown?: (e: MouseEvent) => void
  onmouseup?: (e: MouseEvent) => void
  onmousemove?: (e: MouseEvent) => void
  onmouseenter?: (e: MouseEvent) => void
  onmouseleave?: (e: MouseEvent) => void
  onmouseover?: (e: MouseEvent) => void
  onmouseout?: (e: MouseEvent) => void
  oncontextmenu?: (e: MouseEvent) => void
  onauxclick?: (e: MouseEvent) => void
  // 键盘
  onkeydown?: (e: KeyboardEvent) => void
  onkeyup?: (e: KeyboardEvent) => void
  onkeypress?: (e: KeyboardEvent) => void
  // 表单
  oninput?: (e: Event) => void
  onchange?: (e: Event) => void
  onsubmit?: (e: SubmitEvent) => void
  onreset?: (e: Event) => void
  onfocus?: (e: FocusEvent) => void
  onblur?: (e: FocusEvent) => void
  // 指针
  onpointerdown?: (e: PointerEvent) => void
  onpointerup?: (e: PointerEvent) => void
  onpointermove?: (e: PointerEvent) => void
  onpointerenter?: (e: PointerEvent) => void
  onpointerleave?: (e: PointerEvent) => void
  // 其它常用
  onwheel?: (e: WheelEvent) => void
  onscroll?: (e: Event) => void
  ondrag?: (e: DragEvent) => void
  ondragstart?: (e: DragEvent) => void
  ondragend?: (e: DragEvent) => void
  ondragover?: (e: DragEvent) => void
  ondrop?: (e: DragEvent) => void
  ontouchstart?: (e: TouchEvent) => void
  ontouchend?: (e: TouchEvent) => void
  ontouchmove?: (e: TouchEvent) => void
  onload?: (e: Event) => void
  onerror?: (e: ErrorEvent) => void
  oncopy?: (e: ClipboardEvent) => void
  oncut?: (e: ClipboardEvent) => void
  onpaste?: (e: ClipboardEvent) => void
}

export type Attributes = HtmlAttributes & EventAttributes
