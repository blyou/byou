// deepsignal：深度响应式对象。
//
// 用法：
//   const state = $signal({ deep: { a: 'a' } })
//   effect(() => console.log(state.deep.a))   // 读取即订阅
//   state.deep.a = 'b'                        // 只通知读过 state.deep.a 的 effect
//   state.deep = { a: 'c' }                   // 整块替换，通知读过 state.deep 的 effect
//
// 实现要点：
//   - 用 Proxy 包住原始对象，每个 key 各自对应一个 alien signal（惰性创建）：
//     读属性 = 读信号（被当前 effect 收集），写属性 = 写信号（只通知这一个 key），
//     因此兄弟属性之间互不影响，粒度到属性级。
//   - 写入同时用 Reflect.set 同步回原始对象：Object.keys / JSON.stringify /
//     数组 length 这类绕开代理的读取才能拿到最新值。
//   - 属性值是对象或数组时递归代理，并用 WeakMap 缓存，保证 state.deep === state.deep
//     （同一个原始对象永远返回同一个代理，引用比较与去重才成立）。
//   - 只代理普通对象与数组；Date / Map / Set / class 实例等按原值透传，不做深度代理。
//   - 增删改 key 会自增"迭代信号"，让 Object.keys / for...in / 展开也具备响应性。

import { signal } from 'alien-signals'
import { isPlainObject } from './functions'

type Sig<T = any> = {
  (): T
  (value: T): void
}

// 原始对象 → 代理（同一个原始对象只生成一个代理，保证引用稳定）
const proxyMap = new WeakMap<object, object>()
// 代理 → 原始对象（写入时把代理还原成原始值，避免代理套代理）
const rawMap = new WeakMap<object, object>()
// 原始对象 → (key → 该 key 对应的信号)
const storeMap = new WeakMap<object, Map<PropertyKey, Sig>>()
// 原始对象 → 迭代信号（key 增删时自增）
const keysMap = new WeakMap<object, Sig<number>>()

const sigOf = (target: object, key: PropertyKey): Sig => {
  let store = storeMap.get(target)
  if (!store) storeMap.set(target, (store = new Map()))
  let sig = store.get(key)
  if (!sig) store.set(key, (sig = signal((target as Record<PropertyKey, unknown>)[key])))
  return sig
}

const keysSigOf = (target: object): Sig<number> => {
  let sig = keysMap.get(target)
  if (!sig) keysMap.set(target, (sig = signal(0)))
  return sig
}

// 增删 key 会改变 Object.keys / for...in / 展开的结果，自增一次让它们重跑。
const bumpKeys = (target: object): void => {
  const sig = keysSigOf(target)
  sig(sig() + 1)
}

// 传入的是代理时取回原始对象（WeakMap.get 对非对象键安全返回 undefined）。
const rawOf = (value: unknown): unknown => rawMap.get(value as object) ?? value

const shouldProxy = (value: unknown): value is object =>
  Array.isArray(value) || isPlainObject(value)

const handler: ProxyHandler<object> = {
  get(target, key, receiver) {
    // symbol（Symbol.iterator / Symbol.toStringTag 等）与原型方法不参与收集，直接透传
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver)
    const value = sigOf(target, key)()
    return shouldProxy(value) ? deep(value) : value
  },
  set(target, key, value) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value)
    const raw = rawOf(value)
    const isNew = !Object.prototype.hasOwnProperty.call(target, key)
    // 同步写回原始对象：所有不走代理的读取（Object.keys / JSON / length）都依赖它
    const ok = Reflect.set(target, key, raw)
    sigOf(target, key)(raw) // 只通知读过这一个 key 的 effect
    if (isNew) bumpKeys(target)
    return ok
  },
  deleteProperty(target, key) {
    const had = Object.prototype.hasOwnProperty.call(target, key)
    const ok = Reflect.deleteProperty(target, key)
    if (ok && had) {
      sigOf(target, key)(undefined)
      bumpKeys(target)
    }
    return ok
  },
  has(target, key) {
    if (typeof key === 'symbol') return Reflect.has(target, key)
    sigOf(target, key)() // `k in state` 也建立依赖
    return Reflect.has(target, key)
  },
  ownKeys(target) {
    keysSigOf(target)() // Object.keys / for...in / { ...state } 建立依赖
    return Reflect.ownKeys(target)
  },
}

const deep = <T extends object>(target: T): T => {
  const cached = proxyMap.get(target)
  if (cached) return cached as T
  const proxy = new Proxy(target, handler) as T
  proxyMap.set(target, proxy)
  rawMap.set(proxy, target)
  return proxy
}

// 深度响应式类型：
//   - 逐层递归并去掉 readonly，保证 state.a.b = 1 可写；
//   - 每层额外带上字符串索引签名，允许运行时动态新增属性（state.deep.num = 1），
//     运行时本来就支持（set 陷阱会为该 key 惰性建信号并触发迭代信号）；
//   - 数组只逐项递归、不加索引签名，避免污染 length / map 等成员的类型；
//   - 函数与原始值原样返回（Date / Map / class 实例不深度代理，类型也保持自身形状）。
export type DeepSignal<T> = T extends (infer U)[]
  ? DeepSignal<U>[]
  : T extends (...args: any[]) => any
    ? T
    : T extends object
      ? { -readonly [K in keyof T]: DeepSignal<T[K]> } & { [key: string]: any }
      : T

export const $signal = <T extends object>(initial: T): DeepSignal<T> =>
  deep(initial) as DeepSignal<T>
