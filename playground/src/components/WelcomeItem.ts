import { $, $components, $css } from '../../../src'
import style from './WelcomeItem.css?raw'

const scoped = $css(style)

// 对应 WelcomeItem.vue：图标 + 标题 + 正文（正文经 child 传入）
export const WelcomeItem = $components((props: { heading: string; icon: Element }, child) =>
  $.div({ class: ['item', scoped] }, [
    $.i(props.icon),
    $.div({ class: 'details' }, [$.h3(props.heading), child]),
  ]),
)
