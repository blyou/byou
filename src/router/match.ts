import type { RouteRecord } from './type'

export interface CompiledRoute {
  record: RouteRecord
  regex: RegExp
  names: string[]
}

export interface RouteMatch {
  record: RouteRecord
  params: Record<string, string>
}

// 编译路由路径为正则：':name' 捕获单个路径段，'*' 捕获剩余全部，其余按字面匹配。
// 末尾 '/?$' 让 '/user/42' 与 '/user/42/' 等价。
const compile = (path: string) => {
  const names: string[] = []
  const source = path
    .split('/')
    .map(segment => {
      if (segment.startsWith(':')) {
        names.push(segment.slice(1))
        return '([^/]+)'
      }
      if (segment === '*') {
        names.push('*')
        return '(.*)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { regex: new RegExp(`^${source}/?$`), names }
}

export const compileRoutes = (routes: RouteRecord[]): CompiledRoute[] =>
  routes.map(record => ({ record, ...compile(record.path) }))

// 逐条尝试匹配，命中第一条即返回；未命中返回 null。
export const matchRoute = (routes: CompiledRoute[], path: string): RouteMatch | null => {
  for (const route of routes) {
    const result = route.regex.exec(path)
    if (!result) continue
    const params: Record<string, string> = {}
    for (let i = 0; i < route.names.length; i++)
      params[route.names[i]] = decodeURIComponent(result[i + 1])
    return { record: route.record, params }
  }
  return null
}
