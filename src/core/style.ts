// style：TS 文件内写 CSS，并自动加上 scoped（作用域）效果。
//
// 用法（模块顶层调用一次即可，<style> 只注入一次）：
//   const cls = $css(cssText)     // 返回作用域类名，如 "by-s0"
//   e.button({ class: ['by-button', cls] })
//   // 第一层级（最左侧那个复合选择器）的类名都会拼接上作用域类：
//   //   .by-button        → .by-s0.by-button
//   //   .by-button:hover  → .by-s0.by-button:hover
//   //   .pink             → .by-s0.pink
//   // 嵌套层级（组合符之后）不拼接，靠第一层级的作用域类收拢在组件内：
//   //   .by-button .icon  → .by-s0.by-button .icon
//
// 规则：
//   - 第一层级拼接    每个选择器最左侧的复合选择器（第一个组合符 空格/>/+/~ 之前的部分）
//                     会被拼接上作用域类 `.{scope}`，不论该类名叫什么；原类名保留、不替换。
//                     也就是说，"第一层级写出的类名"代表的是根元素本身（含其状态类、修饰类）。
//   - 嵌套层级不拼接  嵌套规则里的选择器（组合符之后的复合选择器、或普通 CSS nesting 的内层选择器）
//                     原样保留，不再拼上作用域类；整条选择器已由顶层锚定在组件内。
//   - 支持 @media / @supports 等 at-rule（内部选择器同样作用域化）；@keyframes 不作用域化。
//   - 动态样式请用元素内联 style 属性；本工具用于静态、模板级样式。

const injected = new Set<string>()
let counter = 0

// 为 CSS 文本生成唯一作用域类名并注入 <head>，返回要挂在根元素上的类名。
export function $css(input: string): string {
  const scope = `by-s${counter++}`
  const scoped = scopeCss(input, scope)
  if (!injected.has(scope)) {
    const style = document.createElement('style')
    style.setAttribute('data-by-scope', scope)
    style.textContent = scoped
    document.head.appendChild(style)
    injected.add(scope)
  }
  // 只返回作用域类；根元素自身的业务类名（如 by-button）由调用方按需写在 class 上。
  return scope
}

// 找到"第一层级"（首个复合选择器）的结束位置：即第一个顶层组合符（空格 / > / + / ~）处。
// 会跳过 () 与 [] 内部（如 :not(.a .b)、[data-x="a b"]）以及引号包裹的字符串。
function firstCompoundEnd(sel: string): number {
  let depth = 0
  let quote = ''
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i]
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && (/\s/.test(ch) || ch === '>' || ch === '+' || ch === '~')) return i
  }
  return sel.length
}

// 将单个选择器限定到作用域（第一层级）：
//   - 插到该层级第一个类名之前；
//   - 该层级若没有类名：
//       - 以元素选择器开头（button / *）→ 追加到元素后，变成 `button.by-s0`；
//       - 以伪类/伪元素/id/属性等开头（:active / ::before / #id / [attr]）
//         → 放到最前，变成 `.by-s0:active`，避免 `:active.by-s0` 这种顺序；
//   - 组合符之后的嵌套层级保持原样，由第一层级把整条选择器锚定在组件内。
function scopeSelector(sel: string, scope: string): string {
  const s = sel.trim()
  if (s.includes(`.${scope}`)) return s
  const end = firstCompoundEnd(s)
  const head = s.slice(0, end)
  const m = head.match(/\.(-?[_a-zA-Z][\w-]*)/)
  if (m) {
    const at = m.index ?? 0
    return `${s.slice(0, at)}.${scope}${s.slice(at)}`
  }
  // 没有类名时：元素/通配选择器追加在后面，其它选择器（伪类/伪元素/id/属性）放在最前。
  const first = head.trimStart()
  if (/^[a-zA-Z*]/.test(first)) {
    return `${s.slice(0, end)}.${scope}${s.slice(end)}`
  }
  return `.${scope}${s}`
}

// 括号匹配，找到与 pos 处 '{' 对应的 '}' 位置。
function matchingBrace(css: string, pos: number): number {
  let depth = 0
  for (let i = pos; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return css.length
}

// 递归作用域化 CSS：剥离注释，处理 at-rule（@media 等递归、@keyframes 直通）与规则。
// 关键约定：只有“顶层规则”的选择器会被作用域化；嵌套规则的选择器保持原样，
// 依靠浏览器原生 CSS nesting 展开（例如 .by-s0.pink { .hover {...} } → .by-s0.pink .hover）。
// 这样内层类名不会再被拼上 .{scope}，符合“之后的层级都不需要加 scope”的要求。
function scopeCss(css: string, scope: string, topLevel = true): string {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let out = ''
  let i = 0
  while (i < text.length) {
    const brace = text.indexOf('{', i)
    if (brace === -1) {
      out += text.slice(i)
      break
    }
    const head = text.slice(i, brace).trim()
    const end = matchingBrace(text, brace)
    const inner = text.slice(brace + 1, end)
    if (head.startsWith('@keyframes') || head.startsWith('@-webkit-keyframes')) {
      out += `${head} {\n${inner}\n}\n`
    } else if (head.startsWith('@')) {
      // at-rule 内部是否继续作用域化，取决于它本身是否在顶层。
      out += `${head} {\n${scopeCss(inner, scope, topLevel)}\n}\n`
    } else if (topLevel) {
      const scopedHead = head
        .split(',')
        .map(s => scopeSelector(s, scope))
        .join(',\n')
      out += `${scopedHead} {\n${scopeCss(inner, scope, false)}\n}\n`
    } else {
      // 非顶层普通规则：选择器原样保留，内部继续按非顶层处理。
      out += `${head} {\n${scopeCss(inner, scope, false)}\n}\n`
    }
    i = end + 1
  }
  return out
}
