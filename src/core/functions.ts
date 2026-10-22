// 判断是否为"普通对象"：{} / Object.create(null) / 跨 realm 的字面量对象。
//
// 相比 `typeof val === 'object' && !Array.isArray(val)`，这里严格排除：
//   null、函数、装箱基本类型（new String() / new Number() ...）、
//   内置实例（Date / RegExp / Map / Set / WeakMap / Error / Promise / TypedArray / arguments）、
//   宿主对象（DOM 节点、window、location ...）以及 class 实例。
//
// 判定顺序（先便宜后昂贵）：
//   1. typeof 必须是 'object' —— 先挡掉 null、原始值和函数；
//   2. 原型为 null 直接通过 —— Object.create(null) 也是普通对象；
//   3. 内置标签必须是 '[object Object]' —— 由引擎给出，跨 realm 稳定，
//      比 instanceof / constructor 可靠，可一次排除上面列出的绝大多数非普通对象；
//   4. 直接原型必须就是原型链的顶端 —— 挡掉 class 实例（它们的直接原型是
//      Xxx.prototype，而链尾才是 Object.prototype）。这里"走到链尾再比较"而非
//      直接 === Object.prototype，是为了让 iframe 等跨 realm 的普通对象也返回 true。
export const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  if (val === null || typeof val !== 'object') return false
  const proto: object | null = Object.getPrototypeOf(val)
  if (proto === null) return true
  if (Object.prototype.toString.call(val) !== '[object Object]') return false
  let root: object = proto
  let next: object | null = Object.getPrototypeOf(root)
  while (next !== null) {
    root = next
    next = Object.getPrototypeOf(root)
  }
  return proto === root
}
