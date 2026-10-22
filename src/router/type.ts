import type { Component } from '../core/component.type'

export interface RouteRecord {
  /** 路径模式：支持 ':name' 动态段（如 /user/:id）与 '*' 通配段（如 404 兜底） */
  path: string
  component: Component
}

export interface RouteLocation {
  /** 路径部分，不含 query（如 /user/42） */
  path: string
  /** 完整路径，含 query（如 /user/42?tab=info） */
  fullPath: string
  /** 动态段参数，如 { id: '42' } */
  params: Record<string, string>
  /** query 参数，如 { tab: 'info' } */
  query: Record<string, string>
  /** 命中的路由记录；未命中任何路由时为 null */
  matched: RouteRecord | null
}

export interface RouterLinkProps {
  /** 目标路径 */
  to: string
  /** 使用 history.replaceState 而非 pushState */
  replace?: boolean
  /** 命中当前路由时追加的类名，默认 'router-link-active' */
  activeClass?: string
}

export interface RouterOptions {
  routes: RouteRecord[]
  /** 'history'（默认，History API）或 'hash'（location.hash） */
  mode?: 'history' | 'hash'
}

/** 路由操作方法，由 useRouter 获取 */
export interface Router {
  /** 将路由路径转为浏览器地址（hash 模式会加 '#' 前缀） */
  href: (path: string) => string
  push: (path: string) => void
  replace: (path: string) => void
  back: () => void
  forward: () => void
  go: (delta: number) => void
}
