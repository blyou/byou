import { $, $components, $css, $signal, signal } from '../../../src'
import style from './about.css?raw'
import { ByButton } from '../components/by-button'

const scoped = $css(style)

// 对应 AboutView.vue：整页点击计数，同时演示 signal 与 deepsignal
export const About = $components(() => {
  const count = signal(0)
  const state = $signal({ deep: { num: 0 } })

  const increment = () => {
    count(count() + 1)
    state.deep.num++
    state.deep.a = `a-${count()}`
  }

  return $.div({ class: ['about', scoped] }, [
    $.h1('This is an about page'),
    $.div({ class: 'about-panel' }, [
      $.span({ class: 'about-count' }, count),
      ByButton({ $props: { onclick: increment } }, '点击 +1'),
    ]),
  ])
})
