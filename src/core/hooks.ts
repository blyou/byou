import type { CB } from './hooks.type'

export class Hooks {
  cleans: CB[] = []
  /** 组件卸载时调用，逆序执行清理（后注册先清理，与主流框架一致） */
  invokeClean() {
    for (let i = this.cleans.length - 1; i >= 0; i--) this.cleans[i]()
    this.cleans.length = 0
  }
}

// 渲染期指向“正在构建”的组件实例，onClean 收集到它上面
let activeHooks: Hooks

// onMounted 统一进全局队列，并在当前同步任务结束后的微任务里按“元素顺序”(文档前序)一次性触发。
// 这样既能保证回调执行时整棵子树已提交到 DOM，又能天然覆盖“初次挂载”与“后续响应式更新(动态组件)”两种场景，
// 无需 isMounted 这类易错的全局开关，也不会出现“父组件 onMounted 早于子组件入 DOM”的时序问题。
const mountQueue: CB[] = []
let flushScheduled = false

export const flushMounted = () => {
  flushScheduled = false
  for (const cb of mountQueue.splice(0)) cb()
}

export const onMounted = (cb: CB) => {
  mountQueue.push(cb)
  if (!flushScheduled) {
    flushScheduled = true
    queueMicrotask(flushMounted)
  }
}

export const onClean = (cb: CB) => activeHooks.cleans.push(cb)

export const setupHooks = () => (activeHooks = new Hooks())
