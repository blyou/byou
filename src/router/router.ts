import { effect, signal } from 'alien-signals'
import { $components } from '../core/component'
import type { ComponentInstance } from '../core/component.type'
import { mountChild } from '../core/dom'
import { onClean } from '../core/hooks'
import { $ } from '../core/render'
import { compileRoutes, matchRoute } from './match'
import type { RouteLocation, Router, RouterLinkProps, RouterOptions } from './type'

/** 内部完整形态：操作方法 + 响应式 current（仅路由内部与 useRoute 使用） */
type ActiveRouter = Router & { current: () => RouteLocation }

let activeRouter: ActiveRouter | undefined

// 上一个 router 的浏览器监听卸载函数，重复调用 createRouter 时先执行，保证全局至多一个监听器
let teardown: (() => void) | undefined

/** 获取最近一次 createRouter 创建的 router，仅含导航操作方法 */
export const useRouter = (): Router => {
  if (!activeRouter) throw new Error('[byou/router] createRouter 尚未被调用')
  return activeRouter
}

/** 读取当前路由信息（path / params / query / matched）；在 effect / 动态子节点 getter 中调用才会自动订阅更新 */
export const useRoute = (): RouteLocation => {
  if (!activeRouter) throw new Error('[byou/router] createRouter 尚未被调用')
  return activeRouter.current()
}

/** 读取动态段参数（如 { id: '42' }）；在 effect / 动态子节点 getter 中调用才会自动订阅更新 */
export const useParams = (): Record<string, string> => useRoute().params

/** 读取 query 参数（如 { tab: 'info' }）；在 effect / 动态子节点 getter 中调用才会自动订阅更新 */
export const useQuery = (): Record<string, string> => useRoute().query

// 路由切换必须卸载旧页面（执行 onClean 并移除 DOM）。bindChild 的清理只移除
// 自己记录的节点，感知不到 ComponentInstance（其节点由 mountComponentInstance
// 内部 effect 掌控，hooks 清理也不会因 DOM 移除而触发），因此这里用独立 effect
// 自记账：切换时先清理旧实例再挂载新实例。
export const RouterView = $components(() => {
  const container = $.div({ class: 'router-view' })
  let nodes: Node[] = []
  let instance: ComponentInstance | undefined

  const stop = effect(() => {
    const route = useRoute()
    const next = route.matched?.component()
    if (next) {
      instance = next
      mountChild(container, next.el, nodes)
    }
    return () => {
      instance?.hooks.invokeClean()
      instance = undefined
      for (const node of nodes) node.parentNode?.removeChild(node)
      nodes = []
    }
  })

  // RouterView 自身卸载时停掉 effect：停止会先解除对路由信号的订阅，再执行最后
  // 一次 cleanup（清理当前页面 + 移除节点），避免脱离文档后仍随路由变化执行、
  // 持续在游离容器里挂载页面造成泄漏。重复调用 stop 是幂等的。
  onClean(() => stop())

  return container
})

export const RouterLink = $components((props: RouterLinkProps, child) => {
  const { to, replace = false, activeClass = 'router-link-active' } = props
  const router = useRouter()
  return $.a(
    {
      href: router.href(to),
      onclick: (e: MouseEvent) => {
        // 修饰键 / 非左键点击交给浏览器默认行为（新标签打开等）
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return
        e.preventDefault()
        if (replace) router.replace(to)
        else router.push(to)
      },
      class: ['router-link', () => (useRoute().path === to ? activeClass : '')],
    },
    child,
  )
})

export const createRouter = (options: RouterOptions): void => {
  const mode = options.mode ?? 'history'
  const compiled = compileRoutes(options.routes)

  const readPath = () =>
    mode === 'hash' ? location.hash.slice(1) || '/' : location.pathname + location.search

  const resolve = (fullPath: string): RouteLocation => {
    const qIndex = fullPath.indexOf('?')
    const path = qIndex === -1 ? fullPath : fullPath.slice(0, qIndex)
    const search = qIndex === -1 ? '' : fullPath.slice(qIndex + 1)
    const query: Record<string, string> = {}
    for (const [key, value] of new URLSearchParams(search)) query[key] = value
    const matched = matchRoute(compiled, path)
    return {
      path,
      fullPath,
      params: matched?.params ?? {},
      query,
      matched: matched?.record ?? null,
    }
  }

  const current = signal(resolve(readPath()))

  const toUrl = (path: string) => (mode === 'hash' ? `#${path}` : path)

  const navigate = (path: string, replace: boolean) => {
    const url = toUrl(path)
    if (replace) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
    current(resolve(path))
  }

  // pushState/replaceState 不会触发 popstate/hashchange，由 navigate 手动同步信号；
  // 这里只监听浏览器前进/后退与地址栏直达。
  // 创建新 router 前先卸载上一个 router 的监听：否则多次调用 createRouter 会堆积
  // 监听器（每次浏览器回退/前进触发所有旧回调、旧闭包无法回收，内存泄漏）。
  const onPop = () => current(resolve(readPath()))
  teardown?.()
  if (mode === 'hash') window.addEventListener('hashchange', onPop)
  else window.addEventListener('popstate', onPop)
  teardown = () => {
    window.removeEventListener(mode === 'hash' ? 'hashchange' : 'popstate', onPop)
  }

  activeRouter = {
    current,
    href: toUrl,
    push: path => navigate(path, false),
    replace: path => navigate(path, true),
    back: () => history.back(),
    forward: () => history.forward(),
    go: delta => history.go(delta),
  }
}
