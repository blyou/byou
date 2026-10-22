export * from 'alien-signals'

// 核心
export { $el } from './core/dom'
export type {
  Attributes,
  Attrs,
  Child,
  ClassValue,
  EventAttributes,
  HtmlAttributes,
} from './core/dom.type'
export { $signal } from './core/deepsignal'
export type { DeepSignal } from './core/deepsignal'
export { $, $mount } from './core/render'
export type { $Type, Render, RenderOptions } from './core/render.type'
export { $components } from './core/component'
export type { Component, ComponentInstance, RenderFn } from './core/component.type'
export { $css } from './core/style'
export { onMounted, onClean } from './core/hooks'
export type { CB, Lifecycle } from './core/hooks.type'

// 路由
export {
  createRouter,
  useRouter,
  useRoute,
  useParams,
  useQuery,
  RouterView,
  RouterLink,
} from './router/router'
export type {
  Router,
  RouterOptions,
  RouteRecord,
  RouteLocation,
  RouterLinkProps,
} from './router/type'
