import { $, $components, $css, RouterLink } from '../../../src'
import style from './notfound.css?raw'

const scoped = $css(style)

// 兜底页面：配合通配符路由 '*' 处理所有未匹配路径
export const NotFound = $components(() =>
  $.div({ class: ['notfound', scoped] }, [
    $.h1('404'),
    $.p(['你访问的页面不存在。']),
    RouterLink({ $props: { to: '/' } }, '返回首页'),
  ]),
)
