# byou

一个极简的响应式 UI 框架：直接用函数描述 DOM，基于 [alien-signals](https://github.com/stackblitz/alien-signals) 做属性级细粒度更新，内置作用域样式与路由。

- **无模板、无编译**：写的是 TypeScript，运行时直接创建真实 DOM
- **属性级响应式**：getter 写在哪个属性上，就只更新那个属性
- **单文件产物**：iife 版本内联全部依赖，`<script>` 一行引入即可用
- **作用域样式**：`$css` 在运行时为组件样式自动加作用域类
- **内置路由**：History / Hash 双模式，支持动态段与通配兜底

## 安装

```bash
pnpm install @blyou/byou
```

## 快速开始

```ts
import { $, $mount, $signal } from '@blyou/byou'

const state = $signal({ count: 0 })

const App = () =>
  $.div({ class: 'counter' }, [
    $.button({ onclick: () => state.count++ }, ['count is ', () => state.count]),
    $.p(() => (state.count > 5 ? '超过 5 了' : '还没超过 5')),
  ])

$mount('#app', App)
```

`()` 包裹的值是 **getter**，它在内部被放进 effect：读取到哪个信号，就只在那个信号变化时重新求值。

### 浏览器直接引入（iife）

```html
<script src="https://cdn.jsdelivr.net/npm/@blyou/byou"></script>
<script>
  const { $, $mount, $signal } = byou
  $mount('#app', $.h1('Hello byou'))
</script>
```

`dist/index.iife.js` 已内联 `alien-signals`，全局变量名为 `byou`，双击 HTML 用 `file://` 打开也能运行。

### ESM 直接引入

```html
<script type="module">
  import { $, $mount } from 'https://esm.sh/@blyou/byou'
  $mount('#app', $.h1('Hello byou'))
</script>
```

> 注意：`dist/index.mjs` 中的 `alien-signals` 是外部依赖（裸导入），浏览器直连时需借助 import map 或 CDN（如 esm.sh 会自动重写依赖）。本地文件直连建议使用 iife 产物。

## 核心 API

### `$` —— 元素工厂 + querySelector

`$` 是一个 Proxy：访问任意标签名得到渲染函数，调用形式与 `document.querySelector` 保持一致（`$('#app')`、`$('button')`）。

```ts
$.div() // 空 div
$.div('文本') // 单个子节点
$.div({ class: 'card' }, '文本') // 属性 + 子节点
$.div({ class: 'card' }, [$.h1('标题'), $.p('描述')])
$.button({ onclick: e => console.log(e.clientX) }, '点击')
```

**属性（attributes）** 直接平铺在第一个参数里：

- `class`：字符串 / 数组 / getter，数组递归展开并跳过空项
- `style`：字符串（作为 `cssText`）或对象（camelCase 与 kebab-case 都支持）
- `onclick` / `oninput` / `onmouseenter`…：自动 `addEventListener`，常用事件有精确的 `Event` 类型推断
- `null` / `false`：移除该属性；`true`：写入布尔属性（如 `disabled`）
- `value` / `checked` / `id` 等：写 DOM property，保证与 attribute 同步
- `data-*` / `aria-*` 及未知属性：`setAttribute`
- `$props`：其值会与顶层属性合并后写入 DOM（同名时优先级更高）

### `$el`

`$el(tag, attrs?, child?)` 是 `$` 的底层实现，等价于 `$.div(...)` 这类调用的直接写法，适合动态标签：

```ts
$el('section', { class: 'box' }, '内容')
```

### `$mount`

```ts
const stop = $mount('#app', App)
stop() // 卸载：停止 effect 并清空容器
```

容器内容会被清空后重新挂载；返回的卸载函数可用于手动清理。

### 子节点（Child）

任意位置都可以传：

```ts
null | undefined | boolean   // 不渲染
string | number              // 文本节点
Node                         // 已有 DOM 节点
Child[]                      // 数组（自动扁平化）
ComponentInstance            // 组件调用结果
() => Child                  // 动态子节点（响应式）
```

## 响应式

`signal` / `effect` / `computed` / `effectScope` 等全部从 `alien-signals` 原样导出，可直接使用：

```ts
import { effect, signal } from '@blyou/byou'

const count = signal(0)
effect(() => console.log(count())) // 读取即订阅
count(1) // 触发上面这个 effect
```

### `$signal` —— 深度响应式对象

```ts
import { $signal } from '@blyou/byou'

const state = $signal({ user: { name: 'blyou' }, list: [] })

state.user.name = 'byou' // 只通知读过 user.name 的 effect
state.user = { name: 'x' } // 整体替换，通知读过 user 的 effect
state.list.push(1) // 数组方法同样生效
```

实现要点：

- 每个 key 惰性创建一个独立 signal，写入只通知该 key，粒度到属性级
- 同一原始对象永远返回同一代理（`state.user === state.user`）
- `Object.keys` / `for...in` / 展开依赖迭代信号，增删 key 也会触发更新
- 只代理普通对象与数组；`Date` / `Map` / `Set` / class 实例按原值透传

## 组件

用 `$components` 包装渲染函数：

```ts
import { $, $components, $signal, onClean, onMounted } from '@blyou/byou'

export const Counter = $components((props: { label?: string }, child) => {
  onMounted(() => console.log('mounted'))
  onClean(() => console.log('unmounted'))

  const state = $signal({ count: 0 })

  return $.button({ class: 'counter', onclick: () => state.count++ }, [
    () => `${props.label ?? 'count'}: ${state.count}`,
    child,
  ])
})
```

调用组件时，组件专属属性通过 `$props` 传入：

```ts
Counter({ $props: { label: '点击次数' } })
```

> `ComponentInstance` 也是普通对象，因此框架内部通过内部标记区分「渲染选项」与「子节点」。

### 生命周期

| 钩子            | 时机                                                |
| --------------- | --------------------------------------------------- |
| `onMounted(cb)` | 整棵子树提交到 DOM 后的微任务中执行，按文档前序触发 |
| `onClean(cb)`   | 组件卸载时执行，注册顺序的**逆序**清理              |

## 样式：`$css`

把 CSS 写在 TS 文件里，`$css` 会注入 `<style>` 并返回作用域类名：

```ts
import { $css } from '@blyou/byou'
import style from './button.css?raw'

const scope = $css(style)

$.button({ class: ['by-button', scope] }, '按钮')
```

```text
/* 第一层级（最左侧复合选择器）自动拼上作用域类 */
.by-button        → .by-s0.by-button
.by-button:hover  → .by-s0.by-button:hover
/* 嵌套层级不再拼接，由第一层级锚定 */
.by-button .icon  → .by-s0.by-button .icon
```

规则：

- 支持 `@media` / `@supports` 等 at-rule（内部选择器同样作用域化），`@keyframes` 不作用域化
- 每个组件模块顶层调用一次即可，不要放在渲染函数里
- 仅用于静态样式；动态样式请用元素内联 `style`

## 路由

```ts
import { $, $components, createRouter, RouterLink, RouterView, useParams } from '@blyou/byou'

const Home = $components(() => $.h1('Home'))
const About = $components(() => $.h1('About'))
const User = $components(() => $.p(() => `用户 ${useParams().id}`))
const NotFound = $components(() => $.h1('404'))

const App = $components(() =>
  $.div([
    $.nav([
      RouterLink({ $props: { to: '/' } }, 'Home'),
      RouterLink({ $props: { to: '/about' } }, 'About'),
    ]),
    RouterView(),
  ]),
)

createRouter({
  mode: 'history', // 默认；也可用 'hash'
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/user/:id', component: User },
    { path: '*', component: NotFound }, // 兜底，放在最后
  ],
})

$mount('#app', App)
```

### 钩子

| API           | 返回                     | 说明                                                    |
| ------------- | ------------------------ | ------------------------------------------------------- |
| `useRoute()`  | `RouteLocation`          | `{ path, fullPath, params, query, matched }`            |
| `useParams()` | `Record<string, string>` | 动态段参数                                              |
| `useQuery()`  | `Record<string, string>` | query 参数                                              |
| `useRouter()` | `Router`                 | `push` / `replace` / `back` / `forward` / `go` / `href` |

在 effect 或动态子节点 getter 中调用才会自动订阅更新：

```ts
const Page = $components(() => $.main(() => `用户 ${useParams().id}`))
```

### 说明

- **单例**：`createRouter` 返回 `void`，全局只保留最近一次创建的路由器；重复创建会先卸载上一个的 `popstate` / `hashchange` 监听
- **路径匹配**：`:name` 匹配单个路径段，`*` 匹配剩余全部，末尾 `/` 可有可无；命中第一条即返回
- **`RouterLink`**：自动拦截左键无修饰键点击；`replace` 走 `replaceState`，当前路径命中时追加 `activeClass`（默认 `router-link-active`）
- **`RouterView`**：路由切换时先执行旧页面 `onClean` 再挂载新页面，自身卸载时停止订阅
- **history 模式**需要服务端把未知路径回落到 `index.html`，否则刷新 404 页会得到服务器 404

## 类型

所有类型都从包根导出：

```ts
import type {
  Attrs,
  Attributes,
  Child,
  ClassValue,
  Component,
  ComponentInstance,
  RenderFn,
  RenderOptions,
  Render,
  DeepSignal,
  RouteRecord,
  RouteLocation,
  Router,
  RouterOptions,
  RouterLinkProps,
  CB,
  Lifecycle,
} from '@blyou/byou'
```

## 构建与开发

```bash
pnpm install
pnpm play        # 启动 playground（Vite）
pnpm dev         # tsdown watch 构建
pnpm build       # 构建产物
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
```

产物格式：

| 文件                 | 格式 | 用途                                            |
| -------------------- | ---- | ----------------------------------------------- |
| `dist/index.mjs`     | ESM  | 打包器 / `<script type="module">`（依赖外部）   |
| `dist/index.cjs`     | CJS  | Node `require`                                  |
| `dist/index.iife.js` | IIFE | 浏览器 `<script>` 直连，全局 `byou`，已内联依赖 |

## License

[MIT](./LICENSE)
