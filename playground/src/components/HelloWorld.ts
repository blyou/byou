import { $, $components, $css } from '../../../src'
import style from './HelloWorld.css?raw'

const scoped = $css(style)

export const HelloWorld = $components((props: { msg: string }) =>
  $.div({ class: ['greetings', scoped] }, [
    $.h1({ class: 'green' }, props.msg),
    $.h3(['一个无虚拟 DOM、信号驱动的极简响应式 UI 框架。']),
  ]),
)
